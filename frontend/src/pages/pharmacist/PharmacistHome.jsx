import { Link } from 'react-router-dom';
import { ClipboardList, Syringe } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

const cards = [
  {
    to: '/pharmacist/prescriptions',
    title: 'Prescription queue',
    text: 'Review live prescriptions assigned to your pharmacy and respond one by one.',
    icon: Syringe
  },
  {
    to: '/pharmacist/orders',
    title: 'Order queue',
    text: 'Update order progress, pickup codes, and payment state from the database.',
    icon: ClipboardList
  }
];

export default function PharmacistHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active role" value={user?.role || 'pharmacist'} caption="Dedicated pharmacist workspace" />
        <StatCard label="Step one" value="Prescriptions" tone="accent" caption="Review before orders" />
        <StatCard label="Step two" value="Orders" caption="Update fulfillment separately" />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.to} to={card.to} className="medisync-card block transition hover:-translate-y-1 hover:shadow-glow">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={18} /></span>
              <h2 className="mt-4 text-lg font-bold text-slate-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
            </Link>
          );
        })}
      </section>

      <section className="medisync-panel">
        <p className="medisync-kicker w-fit text-slate-500">Pharmacist flow</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Work in separate queues</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Review prescriptions on one page and manage orders on another. Each screen reads directly from MongoDB and writes updates back through the live API.
        </p>
      </section>
    </div>
  );
}
