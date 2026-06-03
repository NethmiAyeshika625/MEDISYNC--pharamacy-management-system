import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmCheckout } from '../lib/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Confirming payment...');
  const [isConfirming, setIsConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');

  const confirm = useCallback(async () => {
    if (!sessionId || !orderId) {
      setMessage('Missing session or order information.');
      setError('Missing session or order information');
      return;
    }

    setIsConfirming(true);
    setError(null);
    try {
      await confirmCheckout(sessionId, orderId);
      setSuccess(true);
      setMessage('Payment confirmed. Redirecting to orders...');
      setTimeout(() => navigate('/orders'), 1400);
    } catch (err) {
      setError(err.message || 'Failed to confirm payment');
      setMessage('Failed to confirm payment. You can retry or check your orders.');
    } finally {
      setIsConfirming(false);
    }
  }, [sessionId, orderId, navigate]);

  useEffect(() => {
    confirm();
  }, [confirm]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Payment status</h1>
      <p className="mt-4">{message}</p>

      {isConfirming ? <p className="mt-2 text-sm text-slate-600">Confirming...</p> : null}

      {error ? (
        <div className="mt-4 rounded-md bg-rose-50 p-3 text-rose-800">{error}</div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-md bg-teal-50 p-3 text-teal-900">Payment confirmed. Redirecting...</div>
      ) : (
        <div className="mt-6 flex gap-3">
          <button className="medisync-button-primary" onClick={confirm} disabled={isConfirming}>Retry confirm</button>
          <button className="medisync-button-secondary" onClick={() => navigate('/orders')}>Go to orders</button>
        </div>
      )}
    </div>
  );
}
