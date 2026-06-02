import { useEffect, useState } from 'react';
import { request } from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApproveUser, setSelectedApproveUser] = useState(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await request('/api/admin/users');
      setUsers(data);
      const ph = await request('/api/admin/pharmacies');
      setPharmacies(ph);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(id, role) {
    try {
      await request(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeUser(id) {
    if (!confirm('Delete this user?')) return;
    try {
      await request(`/api/admin/users/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function verifyUser(id, action, note) {
    try {
      if (action === 'approve') {
        await request(`/api/admin/users/${id}/verify`, { method: 'POST', body: JSON.stringify({ action: 'approve', assignPharmacyId: selectedPharmacyId || undefined }) });
      } else {
        await request(`/api/admin/users/${id}/verify`, { method: 'POST', body: JSON.stringify({ action: 'reject', note: note || '' }) });
      }
      setSelectedApproveUser(null);
      setSelectedPharmacyId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewLicense(filename) {
    try {
      const token = localStorage.getItem('medisync_token');
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '') + `/api/admin/uploads/licenses/${filename}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Unable to fetch license');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  }

  async function approveSubmit() {
    if (!selectedApproveUser) return;
    await verifyUser(selectedApproveUser._id, 'approve');
  }

  if (loading) return <div className="medisync-panel">Loading users...</div>;

  return (
    <div className="space-y-4">
      {error ? <div className="medisync-panel text-rose-700">{error}</div> : null}
      <div className="medisync-panel">
        <h3 className="text-xl font-semibold">Users</h3>
        <div className="mt-3 space-y-2">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{u.name} <span className="text-sm text-slate-500">({u.email})</span></div>
                <div className="text-sm text-slate-600">Role: {u.role}{u.role === 'pharmacist' && u.verification ? ` — ${u.verification.status}` : ''}</div>
                {u.role === 'pharmacist' && u.pharmacistProfile ? (
                  <div className="text-sm text-slate-500">Business: {u.pharmacistProfile.businessName || '—'}</div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} className="medisync-input">
                  <option value="patient">patient</option>
                  <option value="pharmacist">pharmacist</option>
                  <option value="admin">admin</option>
                </select>
                {u.role === 'pharmacist' && u.verification && u.verification.status === 'pending' ? (
                  <>
                    <button className="medisync-button" onClick={() => setSelectedApproveUser(u)}>Approve</button>
                    <button className="medisync-button-soft" onClick={() => verifyUser(u._id, 'reject')}>Reject</button>
                    {(u.pharmacistProfile?.licenseFileId || u.pharmacistProfile?.licenseFilename) ? (
                      <button className="medisync-button-soft" onClick={() => viewLicense(u.pharmacistProfile.licenseFileId || u.pharmacistProfile.licenseFilename)}>View license</button>
                    ) : null}
                  </>
                ) : null}
                <button className="medisync-button-soft" onClick={() => removeUser(u._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedApproveUser ? (
        <div className="medisync-panel">
          <h4 className="font-semibold">Approve {selectedApproveUser.name}</h4>
          <div className="mt-2">
            <label className="block text-sm">Assign to pharmacy (optional)</label>
            <select className="medisync-input mt-1" value={selectedPharmacyId || ''} onChange={(e) => setSelectedPharmacyId(e.target.value)}>
              <option value="">(no assignment)</option>
              {pharmacies.map((p) => (
                <option key={p._id} value={p._id}>{p.name} — {p.city}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="medisync-button" onClick={() => approveSubmit()}>Confirm approve</button>
            <button className="medisync-button-soft" onClick={() => { setSelectedApproveUser(null); setSelectedPharmacyId(null); }}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
