import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { request } from '../lib/api';
import { useSocketFeed } from './useSocketFeed';

const panelClass = 'medisync-panel';
const emptyClass = 'medisync-empty';

function formatMoney(value) {
  if (typeof value !== 'number') return '—';
  return `Rs. ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user, socket } = useAuth();

  const loadOrders = useCallback(async () => {
    const data = await request('/api/orders/me');
    setOrders(data);
  }, []);

  function payOrder(orderId) {
    navigate(`/payments/pay/${orderId}`);
  }

  async function choosePaymentMethod(orderId, paymentMethod) {
    try {
      await request(`/api/orders/${orderId}/payment-method`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentMethod })
      });
      await loadOrders();
      setMessage(paymentMethod === 'cash' ? 'Payment method updated to pay at pharmacy.' : 'Payment method updated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadOrders().catch((error) => setMessage(error.message));
  }, [loadOrders]);

  useSocketFeed(socket, 'patient', user?.id, () => {
    loadOrders().catch(() => {});
  });

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}

      <section className={panelClass}>
        <p className="medisync-kicker w-fit text-slate-500">Order history</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Your active and past orders</h2>

        <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {orders.map((order) => (
            <div key={order._id} className="grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{order.pharmacy?.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-950">Order status</h3>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {order.status || 'Unknown'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Fulfillment: {order.fulfillmentMode} · Payment: {order.paymentMethod} / {order.paymentStatus}
                </p>
              </div>
              <div className="text-sm text-slate-600 md:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-950">{formatMoney(Number(order.total))}</p>
                {order.status === 'ready' && order.paymentStatus !== 'paid' && order.paymentMethod !== 'cash' ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="medisync-button-primary" onClick={() => payOrder(order._id)}>Pay with card</button>
                      <button className="medisync-button-soft" onClick={() => choosePaymentMethod(order._id, 'cash')}>Come and pay</button>
                    </div>
                  </div>
                ) : null}
                {order.paymentStatus === 'cash-due' ? <p className="mt-2 font-semibold text-amber-700">Payment method: pay at pharmacy</p> : null}
              </div>
            </div>
          ))}
          {!orders.length ? <div className={emptyClass}>No orders found yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
