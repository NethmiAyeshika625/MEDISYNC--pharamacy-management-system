import { useEffect, useState } from 'react';
import { request } from '../../lib/api';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function AdminAudits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await request('/api/admin/audits');
      setAudits(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="medisync-panel">Loading audits...</div>;

  return (
    <div className="space-y-4">
      {error ? <div className="medisync-panel text-rose-700">{error}</div> : null}
      <div className="medisync-panel">
        <h3 className="text-xl font-semibold">Audit log</h3>
        <div className="mt-3 space-y-2">
          {audits.length === 0 ? <div className="medisync-empty">No audit entries found.</div> : audits.map((a) => (
            <div key={a._id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{a.action} — {a.resourceType}</div>
                  <div className="text-sm text-slate-500">By: {a.actor?.name || a.actor?.email || 'system'} · {formatTime(a.createdAt)}</div>
                </div>
                <div className="text-sm text-slate-600">ID: {String(a.resourceId)}</div>
              </div>
              {a.details ? <pre className="mt-2 text-xs bg-slate-50 p-2 rounded">{JSON.stringify(a.details, null, 2)}</pre> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
