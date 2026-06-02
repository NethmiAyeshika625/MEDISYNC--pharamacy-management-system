import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
  apiVersion: '2022-11-15'
});

function getFrontendUrl() {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL or CLIENT_URL must be configured');
  }

  return frontendUrl;
}

/**
 * Create a Stripe Payment Intent for an order
 * @param {Object} order - Order document with _id, total, patient, pharmacy
 * @returns {Promise<Object>} Stripe PaymentIntent object
 */
export async function createPaymentIntent(order) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        patientId: order.patient.toString(),
        pharmacyId: order.pharmacy.toString()
      },
      description: `Payment for MEDISYNC order ${order._id.toString().slice(-8)}`,
      automatic_payment_methods: {
        enabled: true
      }
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

/**
 * Confirm a payment intent with a payment method
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {string} paymentMethodId - Stripe Payment Method ID
 * @returns {Promise<Object>} Confirmed PaymentIntent object
 */
export async function confirmPaymentIntent(paymentIntentId, paymentMethodId) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${getFrontendUrl()}/orders`
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to confirm payment: ${error.message}`);
  }
}

/**
 * Get the status of a payment intent
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<Object>} PaymentIntent object
 */
export async function getPaymentIntentStatus(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
}

/**
 * Refund a payment
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {number} amount - Amount to refund in dollars (optional, full refund if not specified)
 * @returns {Promise<Object>} Stripe Refund object
 */
export async function refundPayment(paymentIntentId, amount = null) {
  try {
    const refundData = {
      payment_intent: paymentIntentId
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData);

    return refund;
  } catch (error) {
    throw new Error(`Failed to refund payment: ${error.message}`);
  }
}

/**
 * Verify webhook signature from Stripe
 * IMPORTANT: Must be called with raw body (not parsed JSON)
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Stripe Event object
 */
export function verifyWebhookSignature(body, signature) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    return event;
  } catch (error) {
    throw new Error(`Webhook verification failed: ${error.message}`);
  }
}

/**
 * Handle payment_intent.succeeded webhook event
 * @param {Object} paymentIntent - Stripe PaymentIntent object from webhook
 * @returns {Object} Normalized payment success data
 */
export async function handlePaymentIntentSucceeded(paymentIntent) {
  const { orderId, patientId } = paymentIntent.metadata || {};

  return {
    orderId,
    patientId,
    status: 'succeeded',
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    timestamp: new Date(paymentIntent.created * 1000)
  };
}

/**
 * Handle payment_intent.payment_failed webhook event
 * @param {Object} paymentIntent - Stripe PaymentIntent object from webhook
 * @returns {Object} Normalized payment failure data
 */
export async function handlePaymentIntentFailed(paymentIntent) {
  const { orderId, patientId } = paymentIntent.metadata || {};

  return {
    orderId,
    patientId,
    status: 'failed',
    paymentIntentId: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message || 'Payment failed',
    errorCode: paymentIntent.last_payment_error?.code || 'unknown',
    timestamp: new Date(paymentIntent.created * 1000)
  };
}

/**
 * Handle charge.succeeded webhook event
 * @param {Object} charge - Stripe Charge object from webhook
 * @returns {Object} Normalized charge success data
 */
export async function handleChargeSucceeded(charge) {
  const { orderId, patientId } = charge.metadata || {};

  return {
    orderId,
    patientId,
    status: 'succeeded',
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    amount: charge.amount / 100,
    timestamp: new Date(charge.created * 1000)
  };
}

/**
 * Handle charge.failed webhook event
 * @param {Object} charge - Stripe Charge object from webhook
 * @returns {Object} Normalized charge failure data
 */
export async function handleChargeFailed(charge) {
  const { orderId, patientId } = charge.metadata || {};

  return {
    orderId,
    patientId,
    status: 'failed',
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    error: charge.failure_message || 'Charge failed',
    failureCode: charge.failure_code || 'unknown',
    timestamp: new Date(charge.created * 1000)
  };
}

/**
 * Handle charge.refunded webhook event
 * @param {Object} charge - Stripe Charge object from webhook
 * @returns {Object} Normalized refund data
 */
export async function handleChargeRefunded(charge) {
  const { orderId, patientId } = charge.metadata || {};

  return {
    orderId,
    patientId,
    status: 'refunded',
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    amountRefunded: charge.amount_refunded / 100,
    timestamp: new Date(charge.created * 1000)
  };
}

/**
 * Create a checkout session for Stripe Checkout
 * @param {Object} order - Order document with total, pharmacy, pharmacy.name
 * @param {string} patientEmail - Patient email for receipt
 * @returns {Promise<Object>} Stripe Checkout Session
 */
export async function createCheckoutSession(order, patientEmail) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `MEDISYNC Order - ${order.pharmacy.name}`,
              description: 'Prescription fulfillment order'
            },
            unit_amount: Math.round(order.total * 100)
          },
          quantity: 1
        }
      ],
      customer_email: patientEmail,
      metadata: {
        orderId: order._id.toString(),
        patientId: order.patient.toString(),
        pharmacyId: order.pharmacy._id.toString()
      },
      success_url: `${getFrontendUrl()}/orders?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getFrontendUrl()}/orders?status=cancel`
    });

    return session;
  } catch (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

/**
 * Retrieve a checkout session
 * @param {string} sessionId - Stripe Checkout Session ID
 * @returns {Promise<Object>} Checkout Session object
 */
export async function getCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    throw new Error(`Failed to retrieve checkout session: ${error.message}`);
  }
}

export async function handleChargeSucceeded(charge) {
  return {
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    amount: charge.amount / 100,
    currency: charge.currency,
    status: 'succeeded'
  };
}
