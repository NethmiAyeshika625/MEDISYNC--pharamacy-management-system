import { ArrowRight, MapPin, Truck } from 'lucide-react';

export default function PharmacyCard({ pharmacy, onSelect, distance }) {
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
            {distance !== undefined && <span className="ml-2 font-semibold">({distance.toFixed(1)} km)</span>}
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
      {Array.isArray(pharmacy.medicinePreview) && pharmacy.medicinePreview.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {pharmacy.medicinePreview.slice(0, 3).map((medicine, index) => (
            <span
              key={`${pharmacy._id}-${index}-${medicine.name}-${medicine.brand}`}
              className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {medicine.name} · {medicine.brand} · {medicine.available ? 'available' : 'unavailable'}
            </span>
          ))}
        </div>
      ) : null}
      
    </button>
  );
}
