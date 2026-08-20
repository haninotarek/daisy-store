import { Link } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight } from './Icons.jsx';
import { useUI } from '../context/UIContext.jsx';

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state fade-in">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pcard">
          <div className="pcard-media"><div className="pcard-img skeleton" /></div>
          <div className="pcard-body">
            <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 14, width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  const { dir } = useUI();
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const Prev = dir === 'rtl' ? IconChevronRight : IconChevronLeft;
  const Next = dir === 'rtl' ? IconChevronLeft : IconChevronRight;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}><Prev size={16} /></button>
      {nums.map((n, i) => n === '…'
        ? <span key={`e${i}`} className="page-ellipsis">…</span>
        : <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => onChange(n)}>{n}</button>)}
      <button className="page-btn" disabled={page >= pages} onClick={() => onChange(page + 1)}><Next size={16} /></button>
    </nav>
  );
}

export function Breadcrumb({ items }) {
  const { dir } = useUI();
  const Sep = dir === 'rtl' ? IconChevronLeft : IconChevronRight;
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="crumb">
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span className="current">{it.label}</span>}
          {i < items.length - 1 && <span className="crumb-sep"><Sep size={13} /></span>}
        </span>
      ))}
    </nav>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  const { t } = useUI();
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal fade-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {message && <p className="muted" style={{ marginTop: 8 }}>{message}</p>}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>{t('cancel')}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel || t('confirm')}</button>
        </div>
      </div>
    </div>
  );
}

export function Spinner({ center }) {
  return <div className={center ? 'spinner-center' : ''}><span className="spin" style={{ width: 26, height: 26 }} /></div>;
}
