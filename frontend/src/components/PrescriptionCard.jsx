const statusTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
 
};

function formatStatus(status) {
  if (!status) {
    return 'Unknown';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PrescriptionCard({ prescription, children }) {
  const imageUrl = prescription.imageUrl || prescription.items?.[0]?.imageUrl || '';

  return (
    <article className="medisync-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="medisync-kicker w-fit text-slate-500">Prescription</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{prescription.description}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[prescription.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {formatStatus(prescription.status)}
        </span>
      </div>
      {imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <img src={imageUrl} alt={prescription.description} className="h-56 w-full object-cover" />
        </div>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
