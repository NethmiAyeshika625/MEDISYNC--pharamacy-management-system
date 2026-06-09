import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';
import StatCard from '../../components/StatCard';

const statusOptions = ['preparing', 'ready', 'out-for-delivery', 'completed'];
const paymentStatusOptions = ['pending', 'cash-due', 'paid', 'failed'];

const statusStyles = {
  'awaiting-payment': 'bg-amber-50 text-amber-800 border-amber-200',
  preparing: 'bg-sky-50 text-sky-800 border-sky-200',
  ready: 'bg-teal-50 text-teal-800 border-teal-200',
  'out-for-delivery': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200'
};

function formatMoney(value) {
  if (typeof value !== 'number') return '—';
  return `Rs. ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style}`}>
      {status?.replace(/-/g, ' ') || 'unknown'}
    </span>
  );
}

export default function PharmacistOrders() {
  const { user, socket } = useAuth();
  const pharmacyId = user?.pharmacyId || user?.pharmacy?._id || '';
  const [pharmacy, setPharmacy] = useState(null);
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    if (!pharmacyId) return;

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
            paymentStatus: order.paymentStatus,
            total: order.total ?? ''
          }
        ])
      )
    );
    setLastUpdated(new Date());
  }, [pharmacyId]);

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, [loadData]);

  useSocketFeed(socket, 'pharmacy', pharmacyId, () => {
    loadData().catch(() => {});
  });

  const queueStats = useMemo(() => {
    const active = orders.filter((order) => order.status !== 'completed');
    return {
      total: orders.length,
      active: active.length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      ready: orders.filter((order) => order.status === 'ready').length,
      awaitingPayment: orders.filter((order) => order.paymentStatus === 'pending' && order.status === 'ready').length
    };
  }, [orders]);

  const sortedOrders = useMemo(() => {
    const priority = { preparing: 0, ready: 1, 'out-for-delivery': 2, 'awaiting-payment': 3, paid: 4, completed: 5 };
    return [...orders].sort((a, b) => {
      const aRank = priority[a.status] ?? 99;
      const bRank = priority[b.status] ?? 99;
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [orders]);

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
      setMessage('Order saved. Patient will see the update live.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="medisync-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Order queue</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{pharmacy?.name || 'No pharmacy assigned'}</h2>
            <p className="mt-2 text-sm text-slate-600">Manage orders for your pharmacy. Changes sync to patients in real time.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
            </span>
            Live queue
            {lastUpdated ? (
              <span className="font-normal text-teal-700">
                · updated {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In queue" value={queueStats.active} caption="Active orders" tone="accent" />
        <StatCard label="Preparing" value={queueStats.preparing} caption="Being prepared now" />
        <StatCard label="Ready" value={queueStats.ready} caption="Ready for patient" />
        <StatCard label="Awaiting pay" value={queueStats.awaitingPayment} caption="Ready but unpaid" />
      </section>

      <section className="space-y-4">
        {sortedOrders.map((order) => {
          const draft = drafts[order._id] || {
            status: order.status,
            pickupCode: order.pickupCode || '',
            paymentStatus: order.paymentStatus,
            total: order.total ?? ''
          };

          return (
            <article key={order._id} className="medisync-panel overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Patient</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{order.patient?.name || 'Unknown patient'}</h3>
                  <p className="mt-1 text-sm text-slate-600">{order.prescription?.description || 'Prescription upload'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.status} />
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                    {order.fulfillmentMode}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.1fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current total</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{formatMoney(Number(order.total))}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Payment</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 capitalize">{order.paymentMethod} · {order.paymentStatus}</p>
                  </div>
                  {order.pickupCode ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Pickup code</p>
                      <p className="mt-2 font-mono text-lg font-bold text-slate-950">{order.pickupCode}</p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">Update order</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                      Order total (Rs.)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="medisync-input mt-2"
                        value={draft.total}
                        onChange={(event) => updateDraft(order._id, 'total', event.target.value)}
                        placeholder="Final amount for patient"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Status
                      <select className="medisync-select mt-2" value={draft.status} onChange={(event) => updateDraft(order._id, 'status', event.target.value)}>
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>{option.replace(/-/g, ' ')}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Payment status
                      <select className="medisync-select mt-2" value={draft.paymentStatus || 'pending'} onChange={(event) => updateDraft(order._id, 'paymentStatus', event.target.value)}>
                        {paymentStatusOptions.map((option) => (
                          <option key={option} value={option}>{option.replace(/-/g, ' ')}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                      Pickup code
                      <input
                        className="medisync-input mt-2"
                        value={draft.pickupCode}
                        onChange={(event) => updateDraft(order._id, 'pickupCode', event.target.value)}
                        placeholder="Optional code for patient collection"
                      />
                    </label>
                  </div>
                  <button type="button" onClick={() => updateOrder(order._id)} className="medisync-button-primary mt-4 w-full">
                    Save changes
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {!sortedOrders.length ? <div className="medisync-empty">No orders in the queue yet.</div> : null}
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
