import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmCheckout } from '../lib/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Confirming payment...');

  useEffect(() => {
    async function confirm() {
      const sessionId = searchParams.get('session_id');
      const orderId = searchParams.get('orderId');
      if (!sessionId || !orderId) {
        setMessage('Missing session or order information.');
        return;
      }

      try {
        await confirmCheckout(sessionId, orderId);
        setMessage('Payment confirmed. Redirecting to orders...');
        setTimeout(() => navigate('/orders'), 1400);
      } catch (err) {
        setMessage(err.message || 'Failed to confirm payment');
      }
    }

    confirm();
  }, [searchParams, navigate]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Payment</h1>
      <p className="mt-4">{message}</p>
    </div>
  );
}
