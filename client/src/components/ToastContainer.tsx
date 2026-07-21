import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {ICONS[t.type]}
          <span>{t.message}</span>
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, display: 'flex' }}
            onClick={() => removeToast(t.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
