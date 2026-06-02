# Stripe Integration Testing Guide

Complete guide for testing Stripe integration in MEDISYNC locally and in production.

## Setup

### 1. Stripe Account Configuration

1. **Create Stripe Account**
   - Go to https://stripe.com/register
   - Verify email and complete onboarding

2. **Get API Keys**
   - Navigate to Dashboard → Developers → API keys
   - Copy **Publishable Key** (pk_test_xxx for testing)
   - Copy **Secret Key** (sk_test_xxx for testing)

3. **Create Webhook Endpoint**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `http://your-domain/api/webhooks/stripe`
   - Select events:
     - `charge.succeeded`
     - `charge.failed`
     - `charge.refunded`
     - `checkout.session.completed`
   - Copy Signing Secret (whsec_xxx)

4. **Configure Environment**
   ```bash
   # backend/.env
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_secret
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   ```

### 2. Test Cards

| Card Number | Expiry | CVC | Outcome |
|-------------|--------|-----|---------|
| 4242 4242 4242 4242 | Any future date | Any 3 digits | ✅ Payment succeeds |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | ❌ Payment fails |
| 4000 0000 0000 0341 | Any future date | Any 3 digits | ⚠️ Requires 3D Secure |
| 5555 5555 5555 4444 | Any future date | Any 3 digits | ✅ Visa Mastercard |
| 378282246310005 | Any future date | Any 4 digits | ✅ American Express |

## Local Testing

### Setup Local Webhook Testing

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Ubuntu/Debian
   sudo apt-get install stripe

   # Windows (download from https://github.com/stripe/stripe-cli/releases)
   ```

2. **Login to Stripe CLI**
   ```bash
   stripe login
   # Paste your restricted API key when prompted
   ```

3. **Start Webhook Forwarding**
   ```bash
   # Forward webhook events to local development server
   stripe listen --forward-to localhost:5000/api/webhooks/stripe

   # Keep this running in a separate terminal
   # You'll see webhook events logged
   ```

4. **Get Webhook Signing Secret**
   ```bash
   # The CLI will display:
   # > Ready! Your webhook signing secret is: whsec_test_xxxxx
   
   # Copy this to your .env file
   STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
   ```

### Run Local Tests

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Payment Flow**
   ```bash
   # 1. Login as patient
   # 2. Create or use existing order
   # 3. Click "Pay Now" button
   # 4. Fill checkout form with test card: 4242 4242 4242 4242
   # 5. Any future expiry date and any 3-digit CVC
   # 6. Click "Pay"
   ```

4. **Verify Webhook**
   - Check Stripe CLI terminal for webhook events
   - Should see `charge.succeeded` and `checkout.session.completed`
   - Backend console should log order status update
   - Frontend should show payment success notification

## Test Scenarios

### Scenario 1: Successful Payment

**Expected Flow:**
1. Patient creates order
2. Clicks "Pay Now"
3. Fills form with valid test card (4242...)
4. Payment succeeds
5. Order status changes to "processing"
6. Real-time notification appears
7. Webhook received and processed

**Verification:**
```bash
# In Stripe Dashboard
- Payment shows in Payments section
- Metadata shows orderId and patientId

# In MongoDB
- Order has paymentStatus: "completed"
- Order has paymentId set to Stripe intent

# In Frontend
- Order appears in "Orders" with "Processing" status
```

### Scenario 2: Failed Payment

**Test Card:** 4000 0000 0000 0002

**Expected Flow:**
1. Patient attempts payment with declining card
2. Error message displayed
3. Order remains in "awaiting-payment" status
4. Payment can be retried

**Verification:**
```bash
# In Stripe Dashboard
- Failed payment appears in Payments
- Error reason visible in details

# In MongoDB
- Order has paymentStatus: "failed"
- Order has failureReason field

# In Frontend
- Error notification shown
- "Retry Payment" button available
```

### Scenario 3: 3D Secure Payment

**Test Card:** 4000 0000 0000 0341

**Expected Flow:**
1. Patient initiates payment
2. 3D Secure authentication required
3. Stripe shows authentication page
4. Patient authenticates (test password: any)
5. Payment succeeds

**Verification:**
- Similar to successful payment
- Extra authentication step confirms 3D Secure handling

### Scenario 4: Refund Payment

**Setup:**
1. Complete successful payment
2. Login as pharmacist

**Expected Flow:**
1. Pharmacist views order
2. Clicks "Refund" button
3. Enters refund reason
4. Refund processed
5. Order status changes to "refunded"
6. Patient receives notification

**Verification:**
```bash
# In Stripe Dashboard
- Refund appears under Payment details
- Original charge shows as refunded

# In MongoDB
- Order has paymentStatus: "refunded"
- Order has refundId set

# In Frontend
- Order shows "Refunded" status
- Refund notification received
```

### Scenario 5: Webhook Recovery

**Purpose:** Test webhook reliability

**Steps:**
1. Make payment while webhook listener is offline
2. Start webhook listener
3. Webhooks should be retried by Stripe

**Verification:**
```bash
# In Stripe Dashboard
- Events tab shows delivery attempts
- Check "Webhooks" → "Events"
- Look for exponential backoff retries
```

## Automated Testing

### Unit Tests

```javascript
// backend/src/tests/stripe.test.js
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createPaymentIntent, refundPayment } from '../utils/stripe.js';

describe('Stripe Integration', () => {
  it('should create payment intent', async () => {
    const order = {
      _id: 'test-order-123',
      patient: 'patient-123',
      pharmacy: 'pharmacy-123',
      total: 50.00
    };

    const intent = await createPaymentIntent(order);
    expect(intent.id).toBeDefined();
    expect(intent.status).toBe('requires_payment_method');
    expect(intent.amount).toBe(5000); // 50.00 in cents
  });

  it('should handle refund', async () => {
    const paymentIntentId = 'pi_test_xxx';
    const refund = await refundPayment(paymentIntentId);
    expect(refund.id).toBeDefined();
    expect(refund.status).toBe('succeeded');
  });
});
```

### Integration Tests

```javascript
// backend/src/tests/payment.integration.test.js
import { request } from 'supertest';
import app from '../app.js';
import Order from '../models/Order.js';

describe('Payment API Integration', () => {
  it('should create checkout session', async () => {
    const order = await Order.create({
      patient: 'patient-123',
      pharmacy: 'pharmacy-123',
      total: 50.00,
      status: 'awaiting-payment'
    });

    const response = await request(app)
      .post('/api/payments/create-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id });

    expect(response.status).toBe(200);
    expect(response.body.url).toBeDefined();
    expect(response.body.sessionId).toBeDefined();
  });

  it('should confirm payment', async () => {
    // This requires a real Stripe test session ID
    const sessionId = 'cs_test_xxx';
    const order = await Order.create({
      patient: 'patient-123',
      pharmacy: 'pharmacy-123',
      total: 50.00
    });

    const response = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, orderId: order._id });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Run Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- stripe.test.js

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

## Production Testing

### 1. Pre-Launch Checklist

- [ ] Switch to live Stripe keys (sk_live_xxx, pk_live_xxx)
- [ ] Update STRIPE_WEBHOOK_SECRET to live value
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/TLS (https://)
- [ ] Test with small transaction first ($1.00)
- [ ] Verify email notifications sent
- [ ] Test refund capability
- [ ] Monitor webhook delivery in Stripe Dashboard

### 2. Initial Live Testing

```bash
# 1. Small test transaction
Amount: $1.00
Card: Use your own test card briefly, then switch to real card

# 2. Verify
- Payment appears in Stripe Dashboard
- Order status updated in application
- Email confirmation received
- Webhook events delivered

# 3. Process refund
- Refund through application
- Verify in Stripe Dashboard
- Confirm refund email sent
```

### 3. Monitor Production

**Stripe Dashboard**
- Navigate to Payments
- Monitor transaction success rate
- Check for failed payments
- Review refunds

**Application Logs**
```bash
# Monitor webhook processing
tail -f logs/api-error.log | grep webhook

# Monitor payment processing
tail -f logs/api-out.log | grep payment

# PM2 monitoring
pm2 monit medisync-api
```

**Stripe Events**
- Go to Developers → Webhooks → Events
- Monitor delivery status
- Check retry attempts
- Alert on delivery failures

## Troubleshooting

### Webhook Not Received

**Check:**
```bash
# 1. Verify secret is correct
grep STRIPE_WEBHOOK_SECRET backend/.env

# 2. Check webhook endpoint URL
# Stripe Dashboard → Developers → Webhooks

# 3. Check network connectivity
curl -i https://yourdomain.com/api/webhooks/stripe

# 4. Check application logs
pm2 logs medisync-api | grep webhook

# 5. Manually resend in Stripe
# Dashboard → Developers → Webhooks → Events → Resend
```

### Payment Shows in Stripe but Order Not Updated

**Likely Cause:** Webhook not received or metadata missing

**Fix:**
```bash
# 1. Check order metadata
db.orders.findOne({ "paymentId": "pi_xxx" })

# 2. Manually update if needed
db.orders.updateOne(
  { _id: ObjectId("...") },
  { $set: { paymentStatus: "completed" } }
)

# 3. Resend webhook from Stripe
```

### Test Card Not Working

**Check:**
1. Card number matches test card exactly
2. Expiry is in future
3. CVC is 3 (or 4 for Amex)
4. Name/address required fields filled
5. Browser allows Stripe (check console for CORS errors)

### High Decline Rate

**Review:**
1. Are you using live keys or test keys?
2. Is 3D Secure enabled? (Test with card ending in 0341)
3. Check AVS/CVC mismatch
4. Monitor Radar rules (Stripe Dashboard → Radar)

## Dashboard Monitoring

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Target: >99%
   - Alert if: <95%

2. **Average Transaction Time**
   - Target: <3 seconds
   - Alert if: >10 seconds

3. **Failed Payment Reasons**
   - Insufficient funds
   - Card expired
   - Fraud blocked
   - 3D Secure failed

4. **Refund Rate**
   - Typical: 2-5%
   - Alert if: >10%

### Stripe Dashboard Health Check

```bash
# Weekly checklist
- [ ] Review failed payments
- [ ] Check webhook health (all events delivered)
- [ ] Verify no disputes/chargebacks
- [ ] Check API error rates
- [ ] Review Radar alerts
- [ ] Confirm bank deposits scheduled
```

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Stripe CLI Guide**: https://stripe.com/docs/stripe-cli
- **Testing Guide**: https://stripe.com/docs/testing
- **Error Codes**: https://stripe.com/docs/error-codes

---

**Last Updated**: 2026-05-29
