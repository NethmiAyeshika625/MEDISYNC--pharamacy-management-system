#!/usr/bin/env node
// Dev helper: call the /api/payments/dev/confirm endpoint for local testing
// Usage:
//   DEV_API=http://localhost:5000 TOKEN=<jwt> ORDER=<orderId> node backend/scripts/dev-confirm-client.js

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const API = process.env.DEV_API || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
const ORDER = process.env.ORDER;

if (!TOKEN || !ORDER) {
  console.error('Missing TOKEN or ORDER env var. Set TOKEN and ORDER.');
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`${API}/api/payments/dev/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ orderId: ORDER })
    });

    const data = await res.json().catch(() => ({}));
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error calling dev confirm:', err.message || err);
    process.exit(1);
  }
})();
