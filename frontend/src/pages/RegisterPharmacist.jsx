import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request, setToken, uploadFile } from '../lib/api';

export default function RegisterPharmacist() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    address: '',
    licenseNumber: ''
  });

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
        const uploaded = await uploadFile(file);
        licenseInfo = uploaded;
      }

      const payload = { ...form };

      if (licenseInfo) {
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
      <div className="w-full rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur">
        <h1 className="text-3xl font-bold text-slate-950">
          Register as Pharmacist
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Submit your pharmacy and license details. An administrator will review
          and approve your application.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          <input
            placeholder="Business / Pharmacy Name"
            value={form.businessName}
            onChange={(e) =>
              setForm({ ...form, businessName: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          <input
            placeholder="Pharmacy Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          <input
            placeholder="License Number"
            value={form.licenseNumber}
            onChange={(e) =>
              setForm({ ...form, licenseNumber: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 transition focus:ring-4"
          />

          {/* License Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Upload License (PDF/Image)
            </label>

            <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50 px-4 py-8 text-center transition hover:border-teal-500 hover:bg-teal-100">
              <div>
                <p className="font-semibold text-teal-700">
                  {file ? file.name : 'Choose License File'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PDF, JPG, PNG (Max 5MB)
                </p>
              </div>

              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <p className="text-xs text-slate-500">
              Admin will review your pharmacist license before approval.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-2xl
              bg-gradient-to-r
              from-teal-600
              to-cyan-600
              px-5
              py-3
              font-semibold
              text-white
              shadow-lg
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-xl
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading
              ? 'Submitting Application...'
              : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}