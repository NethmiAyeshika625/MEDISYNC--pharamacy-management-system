import { ArrowRight, ShieldCheck, Sparkles, Stethoscope, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Patient journey',
    text: 'Search by pharmacy name or location, upload prescriptions, track statuses, and choose pickup or delivery.',
    icon: Stethoscope
  },
  {
    title: 'Pharmacist workflow',
    text: 'Receive prescriptions in realtime, approve or reject them, and manage fulfillment without exposing patient-private data.',
    icon: ShieldCheck
  },
  {
    title: 'Delivery-ready billing',
    text: 'Show bill, delivery charge, and card payment flow only when the pharmacy enables delivery.',
    icon: Truck
  }
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_40px_120px_rgba(2,6,23,0.28)] sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-teal-300">
              <Sparkles size={13} />
              Modern pharmacy network
            </p>
            <h1 className="mt-5 font-[Sora] text-4xl font-bold tracking-tight sm:text-6xl">
              One platform for patients, pharmacists, and admins.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              MEDISYNC connects prescription uploads, pharmacy verification, medicine availability, billing, card payments, and feedback in one calm, professional interface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-5 py-3 font-bold text-slate-950 transition hover:-translate-y-0.5">
                Sign in
                <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="rounded-full border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/10">
                Create patient account
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400/15 text-teal-300">
                      <Icon size={18} />
                    </span>
                    <h2 className="text-lg font-bold">{feature.title}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Patient</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">Search and track</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Find nearby pharmacies, upload prescriptions, and review pending, approved, or rejected status updates.</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Pharmacist</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">Act on live requests</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Approve, reject, prepare, and mark orders ready while patients see the result immediately.</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Admin</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">Monitor the platform</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">See counts for users, pharmacies, prescriptions, and orders from one view.</p>
        </div>
      </section>
    </div>
  );
}
