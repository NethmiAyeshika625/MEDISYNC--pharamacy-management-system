import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import dotenv from 'dotenv';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

const router = express.Router();

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (!webhookSecret) {
      // If webhook secret not configured, attempt naive parse (not recommended for production)
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'paid' }, { new: true })
        .then((order) => {
          if (order) {
            console.log('Order marked paid via webhook:', orderId);
            try {
              const io = req.app?.get('io');
              if (io) {
                io.to(`patient:${order.patient.toString()}`).emit('order:updated', order);
                io.to(`pharmacy:${order.pharmacy.toString()}`).emit('order:updated', order);
              }
            } catch (emitErr) {
              console.error('Failed to emit order update from webhook', emitErr);
            }
          }
        })
        .catch((err) => console.error('Failed updating order from webhook', err));
    }
  }

  res.json({ received: true });
});

export default router;
