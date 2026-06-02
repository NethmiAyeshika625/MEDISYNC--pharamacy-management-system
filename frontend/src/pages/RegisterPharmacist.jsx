import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request, setToken, uploadFile } from '../lib/api';

export default function RegisterPharmacist() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '', address: '', licenseNumber: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let licenseInfo = null;
      if (file) {
        // upload first using existing upload API
        const uploaded = await uploadFile(file);
        licenseInfo = uploaded; // { fileId, downloadUrl }
      }

      const payload = { ...form };
      if (licenseInfo) {
        // use downloadUrl or fileId depending on backend expectations
        payload.licenseDownloadUrl = licenseInfo.downloadUrl;
        payload.licenseFileId = licenseInfo.fileId;
      }

      const data = await request('/api/auth/register-pharmacist', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setToken(data.token);
      navigate('/pharmacist');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-3xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-white/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold">Register as Pharmacist</h1>
        <p className="text-sm text-slate-600 mt-1">Submit your pharmacy and license details. Admin will review and approve.</p>
        <form className="mt-6 space-y-3" onSubmit={handleSubmit} encType="multipart/form-data">
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="medisync-input" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="medisync-input" />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="medisync-input" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="medisync-input" />
          <input placeholder="Business / Pharmacy name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="medisync-input" />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="medisync-input" />
          <input placeholder="License number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="medisync-input" />
          <div>
            <label className="text-sm">Upload license (PDF/image)</label>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files[0])} />
            <p className="text-xs text-slate-500 mt-1">Max 5MB. Admin will review your license.</p>
          </div>
          {error ? <div className="text-rose-600 mt-2">{error}</div> : null}
          <button disabled={loading} className="medisync-button">{loading ? 'Submitting...' : 'Submit application'}</button>
        </form>
      </div>
    </div>
  );
}
