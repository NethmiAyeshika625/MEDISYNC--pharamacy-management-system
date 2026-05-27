import { Link } from 'react-router-dom';
import { ClipboardList, FileUp, MapPinned, UserRoundCog } from 'lucide-react';

const actionCards = [
  {
    to: '/patient/search',
    title: 'Find pharmacy',
    text: 'Search live pharmacy records by name or city and open the public detail page.',
    icon: MapPinned
  },
  {
    to: '/patient/prescriptions',
    title: 'My prescriptions',
    text: 'Review uploaded prescriptions, then create an order when a pharmacy has responded.',
    icon: FileUp
  },
  {
    to: '/orders',
    title: 'My orders',
    text: 'Track pickup, delivery, and payment states from the database-backed order queue.',
    icon: ClipboardList
  },
  {
    to: '/patient/profile',
    title: 'Profile',
    text: 'Keep contact details current so the pharmacy can reach you without delay.',
    icon: UserRoundCog
  }
];

export default function PatientHome() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionCards.map((card) => {
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
        <p className="medisync-kicker w-fit text-slate-500">Welcome to MEDISYNC</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          MEDISYNC makes pharmacy care easy for you: find a nearby pharmacy, open its details, upload your prescription,
          and follow each step clearly from request to order in one simple flow.
        </p>
      </section>
    </div>
  );
}
