import { useUI } from '../context/UIContext.jsx';

const colors = {
  PENDING: '#b08d57', CONFIRMED: '#6f8c6a', PREPARING: '#9c6e48',
  SHIPPED: '#5f7d95', DELIVERED: '#4f7a4a', CANCELLED: '#b4534b',
};

export default function StatusBadge({ status }) {
  const { t } = useUI();
  return (
    <span className="status-badge" style={{ '--sc': colors[status] || '#8a8384' }}>
      <span className="status-dot" />{t(status)}
    </span>
  );
}
