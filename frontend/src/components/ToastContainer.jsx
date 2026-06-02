import Toast from './Toast';
import { useNotification } from '../context/NotificationContext';

export default function ToastContainer() {
  const { toasts, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );
}
