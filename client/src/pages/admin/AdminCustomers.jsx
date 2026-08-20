import { useEffect, useState, useCallback } from 'react';
import { AdminAPI } from '../../services/api.js';
import { Pagination, Spinner } from '../../components/Common.jsx';

export default function AdminCustomers() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    setData(await AdminAPI.customers(params.toString()));
  }, [page, search]);
  useEffect(() => { load().catch(() => setData({ customers: [], pagination: {} })); }, [load]);

  return (
    <div className="admin-page">
      <h1 className="admin-h1">Customers</h1>
      <div className="admin-toolbar"><input className="input" placeholder="Search customers…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      {!data ? <Spinner center /> : (
        <>
          <div className="admin-card admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Joined</th></tr></thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr key={c.id}><td>{c.name}</td><td dir="ltr">{c.email}</td><td dir="ltr">{c.phone || '—'}</td><td>{c.orders}</td><td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
            {data.customers.length === 0 && <p className="muted admin-empty">No customers yet.</p>}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
