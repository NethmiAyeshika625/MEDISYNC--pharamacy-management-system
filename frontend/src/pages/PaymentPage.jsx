import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { request } from '../lib/api';

/* ── Stripe instance (created once, outside component) ───────────────── */
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

/* ── Card element styling ─────────────────────────────────────────────── */
const CARD_STYLE = {
  style: {
    base: {
      color: '#0f172a',
      fontFamily: '"Manrope", sans-serif',
      fontSize: '15px',
      fontWeight: '500',
      '::placeholder': { color: '#94a3b8' },
      iconColor: '#0f172a',
    },
    invalid: { color: '#e11d48', iconColor: '#e11d48' },
  },
};

/* ── Checkout form (uses Stripe hooks — must live inside <Elements>) ──── */
function CheckoutForm({ orderId, orderInfo, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardReady, setCardReady] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setCardError(null);

    const cardEl = elements.getElement(CardElement);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      orderInfo.clientSecret,
      {
        payment_method: {
          card: cardEl,
          billing_details: { name: 'MEDISYNC Patient' },
        },
      }
    );

    if (stripeError) {
      setCardError(stripeError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await request('/api/payments/confirm-intent', {
          method: 'POST',
          body: JSON.stringify({ paymentIntentId: paymentIntent.id, orderId }),
        });
        onSuccess(paymentIntent.id);
      } catch (err) {
        setCardError(err.message || 'Failed to confirm payment on server.');
        setProcessing(false);
      }
    } else {
      setCardError('Payment did not complete. Please try again.');
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-5">
      {/* Card field */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
          Card details
        </label>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-100">
          <CardElement
            options={CARD_STYLE}
            onChange={(e) => {
              setCardReady(e.complete);
              if (e.error) setCardError(e.error.message);
              else setCardError(null);
            }}
          />
        </div>
        {cardError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-rose-600">
            <span>⚠</span> {cardError}
          </p>
        )}
      </div>

      {/* Test card hint */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
        <p className="text-xs font-semibold text-amber-700">
          🧪 Test mode · Use card <span className="font-mono">4242 4242 4242 4242</span>, any future expiry &amp; any CVC
        </p>
      </div>

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || !cardReady || processing}
        className="medisync-button-primary w-full py-4 text-base"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Processing…
          </span>
        ) : (
          `Pay $${orderInfo.total?.toFixed(2) ?? '0.00'}`
        )}
      </button>

      {/* Security note */}
      <p className="text-center text-xs text-slate-400">
        🔒 Secured by Stripe · Your card details are never stored
      </p>
    </form>
  );
}

/* ── Main PaymentPage ─────────────────────────────────────────────────── */
export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [successId, setSuccessId] = useState(null);

  const loadIntent = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await request('/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      setOrderInfo(data);
    } catch (err) {
      setFetchError(err.message || 'Could not load payment details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadIntent(); }, [loadIntent]);

  /* Auto-redirect after success */
  useEffect(() => {
    if (!successId) return;
    const t = setTimeout(() => navigate('/orders'), 2800);
    return () => clearTimeout(t);
  }, [successId, navigate]);

  /* ── No Stripe key configured ─────────────────────────────────────── */
  if (!stripePublishableKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <h1 className="text-xl font-bold text-amber-800 mb-2">Stripe not configured</h1>
          <p className="text-sm text-amber-700">
            Add <code className="rounded bg-amber-100 px-1 font-mono">VITE_STRIPE_PUBLIC_KEY</code> to{' '}
            <code className="rounded bg-amber-100 px-1 font-mono">frontend/.env</code> from your{' '}
            <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer" className="underline font-semibold">
              Stripe dashboard
            </a>.
          </p>
          <button onClick={() => navigate('/orders')} className="mt-6 medisync-button-primary">
            ← Back to orders
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500" />
          <p className="text-sm font-medium text-slate-500">Loading payment details…</p>
        </div>
      </div>
    );
  }

  /* ── Fetch error ──────────────────────────────────────────────────── */
  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-rose-800 mb-2">Unable to load payment</h1>
          <p className="text-sm text-rose-700 mb-6">{fetchError}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadIntent} className="medisync-button-primary">Retry</button>
            <button onClick={() => navigate('/orders')} className="medisync-button-soft">← Orders</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success state ────────────────────────────────────────────────── */
  if (successId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-xl animate-[pulse_2s_ease-in-out_infinite]">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-950 mb-2">Payment successful! 🎉</h1>
          <p className="text-slate-600 mb-1">Your order has been confirmed.</p>
          <p className="text-slate-500 text-sm mb-8">The pharmacy has been notified and will begin preparing your order.</p>
          <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4 mb-6 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Reference</p>
            <p className="font-mono text-sm text-slate-700 break-all">{successId}</p>
          </div>
          <p className="text-xs text-slate-400 mb-4">Redirecting to your orders…</p>
          <button onClick={() => navigate('/orders')} className="medisync-button-primary w-full">
            View my orders
          </button>
        </div>
      </div>
    );
  }

  /* ── Main payment UI ──────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

        <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">

          {/* ── Order summary ──────────────────────────────────────── */}
          <div className="medisync-panel">
            <p className="medisync-kicker mb-4">Order summary</p>

            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <span className="text-xl">💊</span>
              </div>
              <div>
                <p className="font-bold text-slate-950">{orderInfo.pharmacyName}</p>
                <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {orderInfo.fulfillmentMode === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between pb-3">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-800">${orderInfo.subtotal?.toFixed(2) ?? '—'}</span>
              </div>
              {orderInfo.fulfillmentMode === 'delivery' && (
                <div className="flex justify-between py-3">
                  <span className="text-slate-600">Delivery fee</span>
                  <span className="font-semibold text-slate-800">${orderInfo.deliveryFee?.toFixed(2) ?? '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between pt-3">
                <span className="font-bold text-slate-950">Total</span>
                <span className="text-lg font-bold text-slate-950">${orderInfo.total?.toFixed(2) ?? '—'}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: '🔒', label: 'Encrypted' },
                { icon: '✅', label: 'Verified' },
                { icon: '🛡️', label: 'Protected' },
              ].map((b) => (
                <div key={b.label} className="rounded-xl border border-slate-100 bg-white p-2">
                  <div className="text-lg">{b.icon}</div>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-500">{b.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Card payment form ──────────────────────────────────── */}
          <div className="medisync-panel">
            <div className="mb-5 flex items-center justify-between">
              <p className="medisync-kicker">Pay by card</p>
              <div className="flex gap-1.5">
                {['VISA', 'MC', 'AMEX'].map((b) => (
                  <span key={b} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
              <CheckoutForm
                orderId={orderId}
                orderInfo={orderInfo}
                onSuccess={(id) => setSuccessId(id)}
              />
            </Elements>
          </div>

        </div>
      </div>
    
  );
}
