import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { request } from '../lib/api';
import { useSocketFeed } from './useSocketFeed';

const panelClass = 'medisync-panel';
const emptyClass = 'medisync-empty';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user, socket } = useAuth();

  async function loadOrders() {
    const data = await request('/api/orders/me');
    setOrders(data);
  }

  function payOrder(orderId) {
    navigate(`/payments/pay/${orderId}`);
  }

  useEffect(() => {
    loadOrders().catch((error) => setMessage(error.message));
  }, []);

  useSocketFeed(socket, 'patient', user?.id, () => {
    loadOrders().catch(() => {});
  });

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}

      <section className={panelClass}>
        <p className="medisync-kicker w-fit text-slate-500">Order history</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Your active and past orders</h2>
        <p className="mt-2 text-sm text-slate-600">Track pickup, delivery, payment status, and pharmacy progress here.</p>

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
                <p>Subtotal: {order.subtotal}</p>
                <p>Delivery fee: {order.deliveryFee}</p>
                <p className="font-semibold text-slate-950">Total: {order.total}</p>
                {order.deliveryAddress ? <p className="mt-2">Address: {order.deliveryAddress}</p> : null}
                {order.paymentStatus !== 'paid' && order.paymentMethod === 'card' ? (
                  <div className="mt-3">
                    <button className="medisync-button-primary" onClick={() => payOrder(order._id)}>Pay with card</button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {!orders.length ? <div className={emptyClass}>No orders found yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
