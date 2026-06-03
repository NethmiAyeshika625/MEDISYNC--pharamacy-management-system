import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [systemFeedbacks, setSystemFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        const [ov, fb] = await Promise.all([
          request('/api/admin/overview'),
          request('/api/reviews/system').catch(() => [])
        ]);
        if (mounted) {
          setOverview(ov);
          setSystemFeedbacks(fb);
        }
      } catch (err) {
        if (mounted) setMessage(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="medisync-panel">Loading...</div>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        
        <div className="medisync-panel">
          <p className="medisync-kicker">Pharmacists</p>
          <h3 className="mt-2 text-3xl font-bold">{overview?.pharmacists || 0}</h3>
        </div>
        <div className="medisync-panel">
          <p className="medisync-kicker">Pharmacies</p>
          <h3 className="mt-2 text-3xl font-bold">{overview?.pharmacies || 0}</h3>
        </div>
        
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/admin/users" className="medisync-panel hover:shadow-md">
          <p className="medisync-kicker">Users</p>
          <h4 className="mt-2 text-xl font-semibold">Manage users</h4>
        </Link>
        <Link to="/admin/pharmacies" className="medisync-panel hover:shadow-md">
          <p className="medisync-kicker">Pharmacies</p>
          <h4 className="mt-2 text-xl font-semibold">Manage pharmacies</h4>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="medisync-panel">
          <p className="medisync-kicker">Analytics</p>
          <h4 className="mt-2 text-xl font-semibold mb-4">Most Popular Pharmacies</h4>
          <div className="space-y-3">
            {overview?.popularPharmacies?.length ? (
              overview.popularPharmacies.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-600">{p.orderCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Orders</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No data available yet.</p>
            )}
          </div>
        </div>

        <div className="medisync-panel">
          <p className="medisync-kicker">Platform</p>
          <h4 className="mt-2 text-xl font-semibold mb-4">Recent System Feedback</h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {systemFeedbacks.length ? (
              systemFeedbacks.map((fb) => (
                <div key={fb._id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-900 text-sm">{fb.patient?.name || 'Unknown'}</p>
                    <span className="text-amber-500 font-bold text-sm">★ {fb.rating}</span>
                  </div>
                  <p className="text-sm text-slate-700">{fb.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No system feedback received yet.</p>
            )}
          </div>
        </div>
      </section>

      {message ? <div className="medisync-panel text-rose-700">{message}</div> : null}
    </div>
  );
}
