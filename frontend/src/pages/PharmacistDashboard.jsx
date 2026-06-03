import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, PackageCheck, PackageX } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { request } from '../lib/api';
import { useSocketFeed } from './useSocketFeed';
import StatCard from '../components/StatCard';
import PrescriptionCard from '../components/PrescriptionCard';

const panelClass = 'medisync-panel';
const fieldClass = 'medisync-input';
const selectClass = 'medisync-select';
const primaryButtonClass = 'medisync-button-primary';
const softButtonClass = 'medisync-button-soft';
const emptyClass = 'medisync-empty';

const statusActions = [
  { status: 'approved', label: 'Approve', icon: Check },
  { status: 'rejected', label: 'Reject', icon: PackageX },
  { status: 'preparing', label: 'Preparing', icon: Clock3 },
  { status: 'ready', label: 'Ready', icon: PackageCheck }
];

export default function PharmacistDashboard() {
  const { user, socket } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pharmacy, setPharmacy] = useState(null);
  const [orderForm, setOrderForm] = useState({ status: 'preparing', pickupCode: '' });
  const [message, setMessage] = useState('');

  const pharmacyId = user?.pharmacyId || user?.pharmacy?._id || '';

  async function loadData() {
    if (!pharmacyId) {
      return;
    }

    const [pharmacyData, prescriptionsData] = await Promise.all([
      request(`/api/pharmacies/${pharmacyId}`),
      request(`/api/prescriptions/pharmacy/${pharmacyId}`)
    ]);
    const ordersData = await request(`/api/orders/pharmacy/${pharmacyId}`);

    setPharmacy(pharmacyData);
    setPrescriptions(prescriptionsData);
    setOrders(ordersData);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, [pharmacyId]);

  useSocketFeed(socket, 'pharmacy', pharmacyId, () => {
    loadData().catch(() => {});
  });

  const inventoryCount = useMemo(() => pharmacy?.medicines?.length || 0, [pharmacy]);

  async function updateStatus(id, status) {
    try {
      await request(`/api/prescriptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          pharmacistNote: `Updated to ${status} by pharmacist`
        })
      });
      await loadData();
      setMessage(`Prescription marked as ${status}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateOrder(id) {
    try {
      await request(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(orderForm)
      });
      await loadData();
      setMessage('Order updated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Incoming prescriptions" value={prescriptions.length} caption="Realtime queue from patients" />
        <StatCard label="Available medicines" value={inventoryCount} tone="accent" caption="Public inventory preview" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className={panelClass}>
          <p className="medisync-kicker w-fit text-slate-500">Pharmacy profile</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{pharmacy?.name || 'No pharmacy assigned'}</h2>
          <p className="mt-2 text-sm text-slate-600">{pharmacy?.description || 'Attach a pharmacist user to a pharmacy record to start receiving prescriptions.'}</p>
          {pharmacy ? (
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-950">Location:</span> {pharmacy.locationLabel}, {pharmacy.city}</p>
              <p><span className="font-semibold text-slate-950">Phone:</span> {pharmacy.phone}</p>
              <p><span className="font-semibold text-slate-950">Hours:</span> {pharmacy.openingHours}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <PrescriptionCard key={prescription._id} prescription={prescription}>
              <p className="text-sm text-slate-600">Patient: <span className="font-semibold text-slate-950">{prescription.patient?.name}</span></p>
              <p className="mt-1 text-sm text-slate-600">{prescription.patientNote || 'No patient note provided.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => updateStatus(prescription._id, action.status)}
                    className={softButtonClass}
                  >
                    <action.icon size={13} />
                    {action.label}
                  </button>
                ))}
              </div>
            </PrescriptionCard>
          ))}
          {!prescriptions.length ? <p className={emptyClass}>No prescriptions received yet.</p> : null}
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Orders</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Prepare pickup </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select className={selectClass} value={orderForm.status} onChange={(event) => setOrderForm({ ...orderForm, status: event.target.value })}>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
            <input className={fieldClass} value={orderForm.pickupCode} onChange={(event) => setOrderForm({ ...orderForm, pickupCode: event.target.value })} placeholder="Pickup code (optional)" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{order.patient?.name}</p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">{order.status}</h3>
              <p className="text-sm text-slate-600">Mode: {order.fulfillmentMode}</p>
              <p className="text-sm text-slate-600">Payment: {order.paymentStatus}</p>
              <p className="text-sm text-slate-600">Total: {order.total}</p>
              <button type="button" onClick={() => updateOrder(order._id)} className="medisync-button-primary mt-4 w-full">Update order</button>
            </div>
          ))}
          {!orders.length ? <p className={emptyClass}>No pharmacy orders yet.</p> : null}
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</p> : null}
    </div>
  );
}
