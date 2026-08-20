import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import { Pagination, Spinner } from '../../components/Common.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const { money } = useUI();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    setData(await AdminAPI.orders(params.toString()));
  }, [page, search, status]);
  useEffect(() => { load().catch(() => setData({ orders: [], pagination: {} })); }, [load]);

  return (
    <div className="admin-page">
      <h1 className="admin-h1">Orders</h1>
      <div className="admin-toolbar">
        <input className="input" placeholder="Search order # / name / phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {!data ? <Spinner center /> : (
        <>
          <div className="admin-card admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="clickable">
                    <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                    <td>{o.customerName}</td>
                    <td dir="ltr">{o.phone}</td>
                    <td>{o.items.length}</td>
                    <td>{money(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.orders.length === 0 && <p className="muted admin-empty">No orders found.</p>}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
