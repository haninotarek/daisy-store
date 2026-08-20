import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import { Pagination, ConfirmModal, Spinner } from '../../components/Common.jsx';
import { IconEdit, IconDup, IconTrash, IconBox, IconEye } from '../../components/Icons.jsx';

export default function AdminProducts() {
  const { money, toast } = useUI();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const d = await AdminAPI.products(params.toString());
    setData(d);
  }, [page, search, status]);

  useEffect(() => { load().catch(() => setData({ products: [], pagination: {} })); }, [load]);

  const toggle = async (p, field) => {
    try { await AdminAPI.patchProduct(p.id, { [field]: !p[field] }); load(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const duplicate = async (p) => { try { await AdminAPI.duplicateProduct(p.id); toast('Product duplicated'); load(); } catch (e) { toast(e.message, 'error'); } };
  const del = async () => { try { await AdminAPI.deleteProduct(confirmDel.id); toast('Product deleted'); setConfirmDel(null); load(); } catch (e) { toast(e.message, 'error'); } };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-h1">Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary"><IconBox size={16} /> Add Product</Link>
      </div>

      <div className="admin-toolbar">
        <input className="input" placeholder="Search products…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option><option value="active">Active</option><option value="hidden">Hidden</option>
        </select>
      </div>

      {!data ? <Spinner center /> : (
        <>
          <div className="admin-card admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td><div className="admin-thumb">{p.mainImage ? <img src={p.mainImage} alt="" /> : <IconBox size={18} />}</div></td>
                    <td>
                      <div className="admin-prod-name">{p.nameEn}</div>
                      <div className="muted admin-prod-ar">{p.nameAr}</div>
                      <div className="admin-flags">
                        {p.featured && <span className="mini-flag">Featured</span>}
                        {p.isNew && <span className="mini-flag">New</span>}
                        {p.bestSeller && <span className="mini-flag">Best</span>}
                      </div>
                    </td>
                    <td>{p.category?.nameEn || '—'}</td>
                    <td>{money(p.effectivePrice)}{p.onSale && <div className="muted was-sm">{money(p.price)}</div>}</td>
                    <td><span className={p.stock === 0 ? 'stock-bad' : p.stock <= 5 ? 'stock-warn' : ''}>{p.stock}</span>{p.hasVariants && <span className="muted"> (var)</span>}</td>
                    <td><button className={`toggle ${p.active ? 'on' : ''}`} onClick={() => toggle(p, 'active')}><span /></button></td>
                    <td>
                      <div className="admin-row-actions">
                        <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className="icon-btn" title="View"><IconEye size={16} /></a>
                        <Link to={`/admin/products/${p.id}`} className="icon-btn" title="Edit"><IconEdit size={16} /></Link>
                        <button className="icon-btn" title="Duplicate" onClick={() => duplicate(p)}><IconDup size={16} /></button>
                        <button className="icon-btn danger" title="Delete" onClick={() => setConfirmDel(p)}><IconTrash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.products.length === 0 && <p className="muted admin-empty">No products found.</p>}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}

      <ConfirmModal open={!!confirmDel} danger title="Delete product?" message={`"${confirmDel?.nameEn}" will be permanently removed.`} confirmLabel="Delete" onConfirm={del} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
