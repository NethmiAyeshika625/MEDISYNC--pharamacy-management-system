import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { request } from '../lib/api';

const panelClass = 'medisync-panel';
const emptyClass = 'medisync-empty';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const [overviewData, usersData] = await Promise.all([
        request('/api/admin/overview'),
        request('/api/admin/users')
      ]);
      const [pharmaciesData, ordersData] = await Promise.all([
        request('/api/admin/pharmacies'),
        request('/api/admin/orders')
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setPharmacies(pharmaciesData);
      setOrders(ordersData);
    }

    loadData().catch((error) => setMessage(error.message));
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Patients" value={overview?.patients ?? 0} />
        <StatCard label="Pharmacists" value={overview?.pharmacists ?? 0} tone="accent" />
        <StatCard label="Pharmacies" value={overview?.pharmacies ?? 0} />
        <StatCard label="Prescriptions" value={overview?.prescriptions ?? 0} tone="accent" />
        <StatCard label="Orders" value={overview?.orders ?? 0} />
      </div>

      <section className={panelClass}>
        <p className="medisync-kicker w-fit text-slate-500">Users</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Platform access list</h2>
        <div className="mt-6 grid gap-3">
          {users.map((user) => (
            <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div>
                <p className="font-semibold text-slate-950">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <span className="medisync-badge bg-slate-100 uppercase tracking-[0.24em] text-slate-600">{user.role}</span>
            </div>
          ))}
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</p> : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={panelClass}>
          <p className="medisync-kicker w-fit text-slate-500">Pharmacies</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Public pharmacy records</h2>
          <div className="mt-4 space-y-3">
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <p className="font-semibold text-slate-950">{pharmacy.name}</p>
                <p className="text-sm text-slate-500">{pharmacy.city} · {pharmacy.deliveryEnabled ? 'Delivery' : 'Pickup only'}</p>
                <p className="text-sm text-slate-500">Pharmacist: {pharmacy.pharmacist?.name || 'Unassigned'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={panelClass}>
          <p className="medisync-kicker w-fit text-slate-500">Orders</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Platform order queue</h2>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <p className="font-semibold text-slate-950">{order.patient?.name} · {order.pharmacy?.name}</p>
                <p className="text-sm text-slate-500">{order.status} · {order.paymentStatus}</p>
                <p className="text-sm text-slate-500">Total: {order.total}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
