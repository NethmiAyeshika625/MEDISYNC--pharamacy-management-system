import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
const router = express.Router();

/**
 * POST /api/payments/create-intent
 * Create a Stripe PaymentIntent for in-app card payment (Stripe Elements)
 */
router.post('/create-intent', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('pharmacy');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.patient.toString() !== req.userId)
      return res.status(403).json({ message: 'Unauthorized' });
    if (!process.env.STRIPE_SECRET_KEY)
      return res.status(500).json({ message: 'Stripe not configured on server' });
    if (order.paymentStatus === 'paid')
      return res.status(400).json({ message: 'Order already paid' });

    const currency = process.env.STRIPE_CURRENCY || 'lkr';
    let amount = Math.round((order.total || order.subtotal || 0) * 100);
    if (amount < 50) amount = 50;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order._id.toString(),
        patientId: req.userId,
        pharmacyId: order.pharmacy._id.toString()
      },
      description: `MEDISYNC Order – ${order.pharmacy.name}`
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      pharmacyName: order.pharmacy.name,
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      fulfillmentMode: order.fulfillmentMode
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/confirm-intent
 * Confirm a PaymentIntent and mark order as paid
 */
router.post('/confirm-intent', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    if (!paymentIntentId || !orderId)
      return res.status(400).json({ message: 'paymentIntentId and orderId required' });
    if (!process.env.STRIPE_SECRET_KEY)
      return res.status(500).json({ message: 'Stripe not configured' });

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent) return res.status(404).json({ message: 'PaymentIntent not found' });

    if (intent.status === 'succeeded') {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: 'paid', paymentId: paymentIntentId, status: 'preparing' },
        { new: true }
      ).populate('pharmacy');

      if (order) {
        req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          message: 'Payment successful! Your order is being prepared.'
        });
        req.app.get('io')?.to(`pharmacy:${order.pharmacy._id.toString()}`).emit('order:updated', {
          orderId: order._id,
          status: order.status,
          message: 'Payment received for order.'
        });
      }

      return res.json({ success: true, order });
    }

    res.status(400).json({ success: false, message: `Payment status: ${intent.status}` });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/create-session
 * Create a Stripe Checkout Session for payment
 */
router.post('/create-session', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('pharmacy');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to patient
    if (order.patient.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe not configured on server' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'lkr',
            product_data: {
              name: `MEDISYNC Order - ${order.pharmacy.name}`,
              description: `Prescription order from ${order.pharmacy.name}`,
              images: []
            },
            unit_amount: Math.round((order.total || order.subtotal || 0) * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        orderId: order._id.toString(),
        patientId: req.userId,
        pharmacyId: order.pharmacy._id.toString()
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id.toString()}&status=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders?orderId=${order._id.toString()}&status=cancel`,
      customer_email: req.user.email
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a checkout session and update order status
 */
router.post('/confirm', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { sessionId, orderId } = req.body;

    if (!sessionId || !orderId) {
      return res.status(400).json({ message: 'Session ID and Order ID required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe not configured on server' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify payment status
    if (session.payment_status === 'paid' || session.payment_status === 'complete') {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'paid',
          paymentId: session.payment_intent,
          status: 'preparing'
        },
        { new: true }
      ).populate('pharmacy');

      if (order) {
        // Emit socket events for real-time updates
          req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            message: 'Payment successful, order is being prepared'
          });
        req.app.get('io')?.to(`pharmacy:${order.pharmacy.toString()}`).emit('order:updated', {
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          message: 'Payment received for order'
        });
      }

      return res.json({
        success: true,
        order: {
          _id: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total
        }
      });
    }

    res.status(400).json({
      success: false,
      message: 'Payment not completed',
      paymentStatus: session.payment_status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/:sessionId/status
 * Get session status for payment verification
 */
router.get('/:sessionId/status', authRequired, async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountSubtotal: session.amount_subtotal ? session.amount_subtotal / 100 : null,
      amountTotal: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/refund
 * Refund a payment
 */
router.post('/refund', authRequired, allowRoles('pharmacist', 'admin'), async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.paymentId || order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Only paid payments can be refunded' });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentId,
      reason: reason || 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        pharmacyId: order.pharmacy.toString()
      }
    });

    // Update order
    order.paymentStatus = 'refunded';
    order.refundId = refund.id;
    await order.save();

    // Notify patient
    req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      message: 'Payment refunded'
    });

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook endpoint for server-to-server events
 * IMPORTANT: This endpoint must accept raw body for signature verification
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ message: 'Missing Stripe signature header' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({ message: `Webhook signature verification failed: ${err.message}` });
    }

    // Handle webhook events
    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object;
        const order = await Order.findOneAndUpdate(
          { paymentId: charge.payment_intent },
          { paymentStatus: 'paid' },
          { new: true }
        );

        if (order) {
          req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
            orderId: order._id,
            message: 'Payment confirmed'
          });
        }
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object;
        const order = await Order.findOneAndUpdate(
          { paymentId: charge.payment_intent },
          {
            paymentStatus: 'failed',
            failureReason: charge.failure_message
          },
          { new: true }
        );

        if (order) {
          req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
            orderId: order._id,
            message: `Payment failed: ${charge.failure_message}`
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const order = await Order.findOneAndUpdate(
          { paymentId: charge.payment_intent },
          { paymentStatus: 'refunded' },
          { new: true }
        );

        if (order) {
          req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
            orderId: order._id,
            message: 'Payment refunded'
          });
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const { orderId } = session.metadata;

        if (orderId) {
          const order = await Order.findByIdAndUpdate(
            orderId,
            {
              paymentStatus: 'paid',
              paymentId: session.payment_intent,
              status: 'preparing'
            },
            { new: true }
          );

          if (order) {
            req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
              orderId: order._id,
              status: order.status,
              message: 'Payment completed'
            });
            req.app.get('io')?.to(`pharmacy:${order.pharmacy.toString()}`).emit('order:updated', {
              orderId: order._id,
              message: 'Payment received'
            });
          }
        }
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    res.json({ received: true });
  } catch (error) {
    // Log webhook errors
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dev-only: simulate confirming a checkout session (useful for local development)
router.post('/dev/confirm', authRequired, allowRoles('patient','admin'), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DEV_PAYMENTS !== 'true') {
      return res.status(403).json({ message: 'Dev confirm disabled in production' });
    }

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    const order = await Order.findById(orderId).populate('pharmacy');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // patient may only confirm their own order unless admin
    if (req.user.role !== 'admin' && order.patient.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    order.paymentStatus = 'paid';
    order.paymentId = `dev_${Date.now()}`;
    order.status = 'preparing';
    await order.save();

    req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      message: 'Payment simulated (dev)'
    });
    req.app.get('io')?.to(`pharmacy:${order.pharmacy.toString()}`).emit('order:updated', {
      orderId: order._id,
      message: 'Payment simulated (dev)'
    });

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

export default router;
