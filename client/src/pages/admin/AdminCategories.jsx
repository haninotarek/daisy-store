import { useEffect, useState } from 'react';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { ConfirmModal, Spinner } from '../../components/Common.jsx';
import { IconEdit, IconTrash, IconTag, IconClose } from '../../components/Icons.jsx';

const empty = { nameEn: '', nameAr: '', descEn: '', descAr: '', image: '', banner: '', displayOrder: 0, active: true, fieldIds: [] };

export default function AdminCategories() {
  const { toast } = useUI();
  const [cats, setCats] = useState(null);
  const [fields, setFields] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => AdminAPI.categories().then((d) => setCats(d.categories));
  useEffect(() => { load(); AdminAPI.fields().then((d) => setFields(d.fields)); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing.id) await AdminAPI.updateCategory(editing.id, editing);
      else await AdminAPI.createCategory(editing);
      toast('Saved'); setEditing(null); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const del = async (force) => {
    try { await AdminAPI.deleteCategory(confirmDel.id, force); toast('Deleted'); setConfirmDel(null); load(); }
    catch (err) {
      if (err.data?.code === 'CATEGORY_HAS_PRODUCTS') { setConfirmDel({ ...confirmDel, warn: err.message }); }
      else toast(err.message, 'error');
    }
  };

  const toggleField = (fid) => setEditing((c) => ({ ...c, fieldIds: c.fieldIds.includes(fid) ? c.fieldIds.filter((x) => x !== fid) : [...c.fieldIds, fid] }));

  if (!cats) return <Spinner center />;

  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1 className="admin-h1">Categories</h1><button className="btn btn-primary" onClick={() => setEditing({ ...empty })}><IconTag size={16} /> Add Category</button></div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Products</th><th>Order</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td><div className="admin-thumb">{c.image ? <img src={c.image} alt="" /> : <IconTag size={16} />}</div></td>
                <td><div className="admin-prod-name">{c.nameEn}</div><div className="muted admin-prod-ar">{c.nameAr}</div></td>
                <td>{c.productCount}</td>
                <td>{c.displayOrder}</td>
                <td>{c.active ? <span className="badge badge-soft">Active</span> : <span className="badge badge-out">Hidden</span>}</td>
                <td><div className="admin-row-actions">
                  <button className="icon-btn" onClick={() => setEditing({ ...c })}><IconEdit size={16} /></button>
                  <button className="icon-btn danger" onClick={() => setConfirmDel(c)}><IconTrash size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{editing.id ? 'Edit' : 'Add'} Category</h3><button className="nav-icon" onClick={() => setEditing(null)}><IconClose /></button></div>
            <form onSubmit={save} className="modal-body">
              <div className="grid-2">
                <div className="field"><label>Name (English)</label><input value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} /></div>
                <div className="field"><label>Name (Arabic)</label><input value={editing.nameAr} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Description (English)</label><textarea value={editing.descEn} onChange={(e) => setEditing({ ...editing, descEn: e.target.value })} /></div>
                <div className="field"><label>Description (Arabic)</label><textarea value={editing.descAr} onChange={(e) => setEditing({ ...editing, descAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Category Image</label><ImageUploader single value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} /></div>
                <div className="field"><label>Banner Image</label><ImageUploader single value={editing.banner} onChange={(url) => setEditing({ ...editing, banner: url })} /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Display Order</label><input type="number" value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })} /></div>
                <div className="field"><label>Status</label><label className="check-row"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /><span>Active</span></label></div>
              </div>
              <div className="field">
                <label>Applicable Product Fields</label>
                <div className="chip-select">
                  {fields.map((f) => (
                    <button type="button" key={f.id} className={`option-chip ${editing.fieldIds.includes(f.id) ? 'active' : ''}`} onClick={() => toggleField(f.id)}>{f.nameEn}</button>
                  ))}
                </div>
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmDel} danger title="Delete category?" message={confirmDel?.warn || `"${confirmDel?.nameEn}" will be removed.`} confirmLabel={confirmDel?.warn ? 'Delete anyway' : 'Delete'} onConfirm={() => del(!!confirmDel?.warn)} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
