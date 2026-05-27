import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
const router = express.Router();

// Create a Stripe Checkout Session for an order
router.post('/create-session', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('pharmacy');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
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
            currency: 'usd',
            product_data: { name: `Order ${order._id}` },
            unit_amount: Math.round((order.total || order.subtotal || 0) * 100)
          },
          quantity: 1
        }
      ],
      metadata: { orderId: order._id.toString() },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payments/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id.toString()}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payments/cancel`
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    next(error);
  }
});

// Confirm a checkout session (retrieves session and updates order payment status)
router.post('/confirm', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { sessionId, orderId } = req.body;
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe not configured on server' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.payment_status === 'paid' || session.payment_status === 'complete') {
      const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'paid' }, { new: true });
      if (order) {
        req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', order);
        req.app.get('io')?.to(`pharmacy:${order.pharmacy.toString()}`).emit('order:updated', order);
      }
      return res.json({ ok: true, order });
    }

    res.status(400).json({ message: 'Payment not completed' });
  } catch (error) {
    next(error);
  }
});

export default router;
