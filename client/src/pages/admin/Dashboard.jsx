import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { Spinner } from '../../components/Common.jsx';
import { IconBox, IconClipboard, IconTag } from '../../components/Icons.jsx';

const StatCard = ({ label, value, tone }) => (
  <div className={`stat-card ${tone || ''}`}><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>
);

export default function Dashboard() {
  const { money } = useUI();
  const [data, setData] = useState(null);
  useEffect(() => { AdminAPI.dashboard().then(setData).catch(() => setData(false)); }, []);

  if (data === null) return <Spinner center />;
  if (!data) return <p>Failed to load dashboard.</p>;
  const s = data.stats;

  return (
    <div className="admin-page">
      <h1 className="admin-h1">Dashboard</h1>

      <div className="stat-grid">
        <StatCard label="Total Products" value={s.totalProducts} />
        <StatCard label="Total Orders" value={s.totalOrders} />
        <StatCard label="Pending" value={s.pending} tone="warn" />
        <StatCard label="Confirmed" value={s.confirmed} />
        <StatCard label="Delivered" value={s.delivered} tone="good" />
        <StatCard label="Low Stock" value={s.lowStock} tone="warn" />
        <StatCard label="Out of Stock" value={s.outOfStock} tone="bad" />
        <StatCard label="Revenue" value={money(s.revenue)} tone="good" />
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-head"><h3>Recent Orders</h3><Link to="/admin/orders" className="admin-link-sm">View all</Link></div>
          {data.recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                    <td>{o.customerName}</td>
                    <td>{money(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-head"><h3>Low / Out of Stock</h3></div>
          {data.lowStockItems.length === 0 && data.outOfStockItems.length === 0 ? <p className="muted">All stocked up.</p> : (
            <ul className="stock-list">
              {[...data.outOfStockItems, ...data.lowStockItems].slice(0, 12).map((it) => (
                <li key={it.type + it.id}>
                  <span>{it.nameEn}{it.label ? ` — ${it.label}` : ''}</span>
                  <span className={`badge ${it.stock === 0 ? 'badge-out' : 'badge-new'}`}>{it.stock === 0 ? 'Out' : `${it.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-quick">
        <Link to="/admin/products/new" className="btn btn-primary"><IconBox size={16} /> Add Product</Link>
        <Link to="/admin/categories" className="btn btn-outline"><IconTag size={16} /> Add Category</Link>
        <Link to="/admin/orders" className="btn btn-outline"><IconClipboard size={16} /> View Orders</Link>
      </div>
    </div>
  );
}
