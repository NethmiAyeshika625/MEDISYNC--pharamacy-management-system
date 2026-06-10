import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';

export default function PatientProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', avatarUrl: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || ''
    });
  }, [user]);

  async function saveProfile(event) {
    event.preventDefault();
    try {
      await updateProfile(form);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="medisync-panel">
        <p className="medisync-kicker w-fit text-slate-500">Account</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Update your profile</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Keep the profile lean and current so pharmacy staff can contact you without guessing.
        </p>
        <form className="mt-5 space-y-4" onSubmit={saveProfile}>
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input className="medisync-input mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Phone
            <input className="medisync-input mt-2" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
         
          <button className="medisync-button-primary w-full">Save profile</button>
        </form>
      </section>

      <section className="medisync-panel">
        <p className="medisync-kicker w-fit text-slate-500">Current account</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">{user?.name}</h3>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
          <p>Phone: {user?.phone || 'Not set'}</p>
        </div>
        {message ? <div className="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
      </section>
    </div>
  );
}
