import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Search, ShieldCheck, Syringe } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSocketNotifications } from '../hooks/useSocketNotifications';
import { cn } from './helpers';

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive ? 'bg-slate-900 text-white shadow-glow' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
  );

export default function Layout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useSocketNotifications();

  const moduleLinks =
    user?.role === 'patient'
      ? [
          { to: '/patient/search', label: 'Find Pharmacy' },
          { to: '/patient/prescriptions', label: 'Prescriptions' },
          { to: '/orders', label: 'Orders' },
          { to: '/patient/feedback', label: 'Feedback' },
          { to: '/patient/profile', label: 'Profile' }
        ]
      : user?.role === 'pharmacist'
        ? [
            { to: '/pharmacist/stock', label: 'Stock Control' },
            { to: '/pharmacist/prescriptions', label: 'Prescription Queue' },
            { to: '/pharmacist/orders', label: 'Orders' },
            { to: '/pharmacist/messages', label: 'Messages' },
            { to: '/pharmacist/feedback', label: 'Feedback' }
          ]
        : [];

  return (
    <div className="medisync-shell">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 font-[Sora] text-xl font-bold tracking-tight">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-glow">
                <Syringe size={20} />
              </span>
              MEDISYNC
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm md:flex">
                <Search size={15} />
                Smart pharmacy network
              </div>
              {user ? (
                <>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-glow">
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            {moduleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="medisync-panel-lg mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="medisync-kicker mb-2">
                <ShieldCheck size={13} />
                Connected healthcare workflow
              </p>
              <h1 className="font-[Sora] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-glow">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                <Bell size={15} />
                Realtime updates
              </div>
              <p className="mt-2 text-sm text-slate-300">Prescriptions, approvals, and delivery states flow live between patient and pharmacy.</p>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
