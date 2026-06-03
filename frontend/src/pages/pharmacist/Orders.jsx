import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';

const statusOptions = ['preparing', 'ready', 'out-for-delivery', 'completed'];
const paymentStatusOptions = ['pending', 'paid', 'failed'];

export default function PharmacistOrders() {
  const { user, socket } = useAuth();
  const pharmacyId = user?.pharmacyId || user?.pharmacy?._id || '';
  const [pharmacy, setPharmacy] = useState(null);
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');

  async function loadData() {
    if (!pharmacyId) {
      return;
    }

    const [pharmacyData, ordersData] = await Promise.all([
      request(`/api/pharmacies/${pharmacyId}`),
      request(`/api/orders/pharmacy/${pharmacyId}`)
    ]);

    setPharmacy(pharmacyData);
    setOrders(ordersData);
    setDrafts(
      Object.fromEntries(
        ordersData.map((order) => [
          order._id,
          {
            status: order.status,
            pickupCode: order.pickupCode || '',
            paymentStatus: order.paymentStatus
          }
        ])
      )
    );
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  useSocketFeed(socket, 'pharmacy', pharmacyId, () => {
    loadData().catch(() => {});
  });

  const orderCount = useMemo(() => orders.length, [orders]);

  function updateDraft(orderId, field, value) {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {}),
        [field]: value
      }
    }));
  }

  async function updateOrder(orderId) {
    try {
      const draft = drafts[orderId] || {};
      await request(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(draft)
      });
      await loadData();
      setMessage('Order updated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="medisync-panel">
        <p className="medisync-kicker w-fit text-slate-500">Order queue</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{pharmacy?.name || 'No pharmacy assigned'}</h2>
        <p className="mt-2 text-sm text-slate-600">Update fulfillment state one order at a time from live database records.</p>
        <div className="mt-4 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
          {orderCount} order{orderCount === 1 ? '' : 's'} in queue
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => {
          const draft = drafts[order._id] || { status: order.status, pickupCode: order.pickupCode || '', paymentStatus: order.paymentStatus };

          return (
            <div key={order._id} className="medisync-card">
              <p className="medisync-kicker w-fit text-slate-500">{order.patient?.name}</p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">{order.status}</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>Prescription: {order.prescription?.description || 'Not linked'}</p>
                <p>Fulfillment: {order.fulfillmentMode}</p>
                <p>Payment: {draft.paymentStatus}</p>
                <p>Total: {order.total}</p>
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Status
                <select className="medisync-select mt-2" value={draft.status} onChange={(event) => updateDraft(order._id, 'status', event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Payment status
                <select className="medisync-select mt-2" value={draft.paymentStatus || 'pending'} onChange={(event) => updateDraft(order._id, 'paymentStatus', event.target.value)}>
                  {paymentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Pickup code
                <input className="medisync-input mt-2" value={draft.pickupCode} onChange={(event) => updateDraft(order._id, 'pickupCode', event.target.value)} placeholder="Optional pickup code" />
              </label>

              <button type="button" onClick={() => updateOrder(order._id)} className="medisync-button-primary mt-4 w-full">
                Save order
              </button>
            </div>
          );
        })}
        {!orders.length ? <div className="medisync-empty">No orders found yet.</div> : null}
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
