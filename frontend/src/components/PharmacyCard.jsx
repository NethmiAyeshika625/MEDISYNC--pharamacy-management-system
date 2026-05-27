import { ArrowRight, MapPin, Truck } from 'lucide-react';

export default function PharmacyCard({ pharmacy, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pharmacy)}
      className="group w-full rounded-[1.75rem] border border-white/70 bg-white/85 p-5 text-left shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="medisync-kicker w-fit">Nearby pharmacy</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{pharmacy.name}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} />
            {pharmacy.locationLabel}, {pharmacy.city}
          </p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{pharmacy.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>{pharmacy.openingHours}</span>
        <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
          View details
          <ArrowRight size={15} className="transition group-hover:translate-x-1" />
        </span>
      </div>
      {pharmacy.deliveryEnabled ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <Truck size={13} />
          Delivery fee {pharmacy.deliveryFee}
        </div>
      ) : null}
    </button>
  );
}
