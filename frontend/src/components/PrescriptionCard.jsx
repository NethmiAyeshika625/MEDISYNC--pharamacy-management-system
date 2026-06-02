const statusTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  preparing: 'bg-sky-50 text-sky-700 border-sky-200',
  ready: 'bg-teal-50 text-teal-700 border-teal-200',
  collected: 'bg-slate-100 text-slate-700 border-slate-200',
  delivered: 'bg-violet-50 text-violet-700 border-violet-200'
};

function formatStatus(status) {
  if (!status) {
    return 'Unknown';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PrescriptionCard({ prescription, children }) {
  return (
    <article className="medisync-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="medisync-kicker w-fit text-slate-500">Prescription</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{prescription.description}</h3>
          <p className="mt-1 text-sm text-slate-600">{prescription.pharmacy?.name || 'Selected pharmacy'}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[prescription.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {formatStatus(prescription.status)}
        </span>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
