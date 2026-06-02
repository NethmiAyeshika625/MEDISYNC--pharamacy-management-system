import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await register({ ...form, role: 'patient' });
      navigate(`/${user.role}`);
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.1)]">
        <h1 className="font-[Sora] text-3xl font-bold text-slate-950">Create patient account</h1>
        <p className="mt-2 text-sm text-slate-600">Patient sign-up is enabled in this starter. Pharmacists and admins are managed separately.</p>
        <p className="mt-1 text-sm text-slate-600">Pharmacists: <Link to="/register-pharmacist" className="font-semibold text-teal-700">Register here</Link> (requires admin verification).</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 focus:ring-4" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 focus:ring-4" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 focus:ring-4" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-teal-200 focus:ring-4" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-semibold text-teal-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
