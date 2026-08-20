import { useUI } from '../context/UIContext.jsx';
import { IconCheck, IconClose } from './Icons.jsx';

export function ToastHost() {
  const { toasts, dismissToast } = useUI();
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status" onClick={() => dismissToast(t.id)}>
          <span className="toast-icon">{t.type === 'error' ? <IconClose size={16} /> : <IconCheck size={16} />}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
