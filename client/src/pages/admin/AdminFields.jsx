import { useEffect, useState } from 'react';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import { ConfirmModal, Spinner } from '../../components/Common.jsx';
import { IconEdit, IconTrash, IconClipboard, IconClose, IconPlus } from '../../components/Icons.jsx';

const TYPES = ['TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'BOOLEAN', 'COLOR', 'SIZE'];
const OPTION_TYPES = ['SELECT', 'MULTISELECT', 'COLOR', 'SIZE'];
const empty = { nameEn: '', nameAr: '', type: 'SELECT', required: false, filterable: true, usedForVariants: false, displayOrder: 0, active: true, options: [], categoryIds: [] };

export default function AdminFields() {
  const { toast } = useUI();
  const [fields, setFields] = useState(null);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => AdminAPI.fields().then((d) => setFields(d.fields));
  useEffect(() => { load(); AdminAPI.categories().then((d) => setCats(d.categories)); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing.id) await AdminAPI.updateField(editing.id, editing);
      else await AdminAPI.createField(editing);
      toast('Saved'); setEditing(null); load();
    } catch (err) { toast(err.message, 'error'); }
  };
  const del = async (force) => {
    try { await AdminAPI.deleteField(confirmDel.id, force); toast('Deleted'); setConfirmDel(null); load(); }
    catch (err) { if (err.data?.code === 'FIELD_IN_USE') setConfirmDel({ ...confirmDel, warn: err.message }); else toast(err.message, 'error'); }
  };

  const addOption = () => setEditing((f) => ({ ...f, options: [...f.options, { valueEn: '', valueAr: '', colorHex: '' }] }));
  const setOption = (i, k, v) => setEditing((f) => ({ ...f, options: f.options.map((o, idx) => idx === i ? { ...o, [k]: v } : o) }));
  const removeOption = (i) => setEditing((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  const toggleCat = (cid) => setEditing((f) => ({ ...f, categoryIds: f.categoryIds.includes(cid) ? f.categoryIds.filter((x) => x !== cid) : [...f.categoryIds, cid] }));

  if (!fields) return <Spinner center />;
  const showOptions = editing && OPTION_TYPES.includes(editing.type);

  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1 className="admin-h1">Product Fields</h1><button className="btn btn-primary" onClick={() => setEditing({ ...empty })}><IconClipboard size={16} /> Add Field</button></div>
      <p className="muted admin-hint">Define the custom attributes your products can have — size, color, material, fit and more. Mark a field "used for variants" to build purchasable combinations with per-variant stock.</p>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Field</th><th>Type</th><th>Options</th><th>Variant</th><th>Filter</th><th></th></tr></thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id}>
                <td><div className="admin-prod-name">{f.nameEn}</div><div className="muted admin-prod-ar">{f.nameAr}</div></td>
                <td><span className="badge badge-soft">{f.type}</span></td>
                <td>{f.options.length ? f.options.slice(0, 4).map((o) => o.valueEn).join(', ') + (f.options.length > 4 ? '…' : '') : '—'}</td>
                <td>{f.usedForVariants ? '✓' : '—'}</td>
                <td>{f.filterable ? '✓' : '—'}</td>
                <td><div className="admin-row-actions"><button className="icon-btn" onClick={() => setEditing({ ...f })}><IconEdit size={16} /></button><button className="icon-btn danger" onClick={() => setConfirmDel(f)}><IconTrash size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{editing.id ? 'Edit' : 'Add'} Field</h3><button className="nav-icon" onClick={() => setEditing(null)}><IconClose /></button></div>
            <form onSubmit={save} className="modal-body">
              <div className="grid-2">
                <div className="field"><label>Name (English)</label><input value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} placeholder="Color" /></div>
                <div className="field"><label>Name (Arabic)</label><input value={editing.nameAr} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })} dir="rtl" placeholder="اللون" /></div>
              </div>
              <div className="grid-3">
                <div className="field"><label>Type</label><select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div className="field"><label>Display Order</label><input type="number" value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })} /></div>
                <div className="field"><label>&nbsp;</label>
                  <div className="publish-flags">
                    <label className="check-row"><input type="checkbox" checked={editing.required} onChange={(e) => setEditing({ ...editing, required: e.target.checked })} /><span>Required</span></label>
                    <label className="check-row"><input type="checkbox" checked={editing.filterable} onChange={(e) => setEditing({ ...editing, filterable: e.target.checked })} /><span>Filterable</span></label>
                    <label className="check-row"><input type="checkbox" checked={editing.usedForVariants} onChange={(e) => setEditing({ ...editing, usedForVariants: e.target.checked })} /><span>Used for variants</span></label>
                  </div>
                </div>
              </div>

              {showOptions && (
                <div className="field">
                  <label>Options</label>
                  {editing.options.map((o, i) => (
                    <div key={i} className="option-editor">
                      <input placeholder="English" value={o.valueEn} onChange={(e) => setOption(i, 'valueEn', e.target.value)} />
                      <input placeholder="Arabic" value={o.valueAr} onChange={(e) => setOption(i, 'valueAr', e.target.value)} dir="rtl" />
                      {editing.type === 'COLOR' && <input type="color" value={o.colorHex || '#cccccc'} onChange={(e) => setOption(i, 'colorHex', e.target.value)} className="color-input" />}
                      <button type="button" className="icon-btn danger" onClick={() => removeOption(i)}><IconTrash size={15} /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm" onClick={addOption}><IconPlus size={14} /> Add option</button>
                </div>
              )}

              <div className="field">
                <label>Applicable Categories <span className="muted">(leave empty = all)</span></label>
                <div className="chip-select">
                  {cats.map((c) => <button type="button" key={c.id} className={`option-chip ${editing.categoryIds.includes(c.id) ? 'active' : ''}`} onClick={() => toggleCat(c.id)}>{c.nameEn}</button>)}
                </div>
              </div>

              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">Save Field</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmDel} danger title="Delete field?" message={confirmDel?.warn || `"${confirmDel?.nameEn}" will be removed.`} confirmLabel={confirmDel?.warn ? 'Delete anyway' : 'Delete'} onConfirm={() => del(!!confirmDel?.warn)} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
