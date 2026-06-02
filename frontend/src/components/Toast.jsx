import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info
};

const colorMap = {
  success: 'bg-teal-50 text-teal-900 border-teal-200',
  error: 'bg-rose-50 text-rose-900 border-rose-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200'
};

export default function Toast({ id, type = 'info', title, message, onClose }) {
  const Icon = iconMap[type] || iconMap.info;

  return (
    <div className={`rounded-xl border p-4 shadow-lg animate-in fade-in slide-in-from-top-4 ${colorMap[type] || colorMap.info}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && <p className="font-semibold">{title}</p>}
          {message && <p className="text-sm mt-1">{message}</p>}
        </div>
        <button
          type="button"
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
