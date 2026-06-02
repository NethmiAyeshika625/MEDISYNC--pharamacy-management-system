#!/usr/bin/env node
// Integration test: verify payment flow using dev confirm endpoint.
// Usage:
// DEV_API=http://localhost:5000 TOKEN=<jwt> ORDER=<orderId> MONGO_URI=mongodb://localhost:27017/medisync node backend/scripts/integration-payment-flow.js

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';

const API = process.env.DEV_API || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
let ORDER = process.env.ORDER;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync';

if (!TOKEN) {
  console.error('Missing TOKEN env var. Set TOKEN to an auth JWT for a patient or admin.');
  process.exit(1);
}

(async () => {
  try {
    if (!ORDER) {
      // connect to DB and find an awaiting-payment order
      await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
      const pending = await Order.findOne({ status: 'awaiting-payment' }).lean();
      if (!pending) {
        console.error('No awaiting-payment order found in DB. Provide ORDER env var.');
        process.exit(2);
      }
      ORDER = pending._id.toString();
      await mongoose.disconnect();
    }

    console.log('Using order:', ORDER);

    const res = await fetch(`${API}/api/payments/dev/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ orderId: ORDER })
    });

    const data = await res.json().catch(() => ({}));
    console.log('Dev confirm status:', res.status, data);

    // verify in DB
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    const order = await Order.findById(ORDER).lean();
    console.log('Order paymentStatus:', order?.paymentStatus, 'status:', order?.status);
    await mongoose.disconnect();

    if (order && order.paymentStatus === 'paid') {
      console.log('Integration test: SUCCESS');
      process.exit(0);
    }

    console.error('Integration test: FAILED');
    process.exit(3);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(4);
  }
})();
