import { cn } from './helpers';

export default function StatCard({ label, value, tone = 'dark', caption }) {
  const toneClasses = {
    dark: 'bg-white/80 text-slate-950',
    accent: 'bg-gradient-to-br from-teal-50 to-cyan-50 text-slate-950'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]',
        tone === 'accent' ? 'border-teal-200' : 'border-white/70',
        toneClasses[tone] || toneClasses.dark
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', tone === 'accent' ? 'bg-teal-400' : 'bg-slate-200')} />
      <p className={cn('text-sm font-semibold uppercase tracking-[0.24em]', tone === 'accent' ? 'text-slate-500' : 'text-slate-500')}>
        {label}
      </p>
      <div className={cn('mt-2 text-3xl font-bold tracking-tight', tone === 'accent' ? 'text-slate-950' : 'text-slate-950')}>
        {value}
      </div>
      {caption ? <p className={cn('mt-2 text-sm', tone === 'accent' ? 'text-slate-600' : 'text-slate-600')}>{caption}</p> : null}
    </div>
  );
}
