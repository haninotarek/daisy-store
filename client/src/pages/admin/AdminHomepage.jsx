import { useEffect, useState } from 'react';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import { Spinner } from '../../components/Common.jsx';
import { IconEdit, IconTrash } from '../../components/Icons.jsx';

export default function AdminHomepage() {
  const { toast } = useUI();
  const [sections, setSections] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => AdminAPI.homepage().then((d) => setSections(d.sections));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try { await AdminAPI.updateSection(editing.id, editing); toast('Saved'); setEditing(null); load(); }
    catch (err) { toast(err.message, 'error'); }
  };
  const toggleVisible = async (s) => { try { await AdminAPI.updateSection(s.id, { visible: !s.visible }); load(); } catch (e) { toast(e.message, 'error'); } };
  const move = async (s, dir) => {
    try { await AdminAPI.updateSection(s.id, { displayOrder: s.displayOrder + dir }); load(); } catch (e) { toast(e.message, 'error'); }
  };

  if (!sections) return <Spinner center />;

  return (
    <div className="admin-page">
      <h1 className="admin-h1">Homepage Sections</h1>
      <p className="muted admin-hint">Control what appears on your homepage and in what order. Toggle visibility, rename sections, or reorder them.</p>

      <div className="admin-card">
        {sections.map((s) => (
          <div key={s.id} className="section-row">
            <div className="section-row-info">
              <div className="section-order">
                <button onClick={() => move(s, -1)} disabled={s.displayOrder === 0}>▲</button>
                <button onClick={() => move(s, 1)}>▼</button>
              </div>
              <div>
                <strong>{s.titleEn || s.key}</strong>
                <div className="muted">{s.type}{s.config?.filter ? ` · ${s.config.filter}` : ''}</div>
              </div>
            </div>
            <div className="admin-row-actions">
              <button className={`toggle ${s.visible ? 'on' : ''}`} onClick={() => toggleVisible(s)}><span /></button>
              <button className="icon-btn" onClick={() => setEditing({ ...s })}><IconEdit size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Section</h3>
            <form onSubmit={save} className="modal-body">
              <div className="grid-2">
                <div className="field"><label>Title (English)</label><input value={editing.titleEn} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} /></div>
                <div className="field"><label>Title (Arabic)</label><input value={editing.titleAr} onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Subtitle (English)</label><input value={editing.subtitleEn} onChange={(e) => setEditing({ ...editing, subtitleEn: e.target.value })} /></div>
                <div className="field"><label>Subtitle (Arabic)</label><input value={editing.subtitleAr} onChange={(e) => setEditing({ ...editing, subtitleAr: e.target.value })} dir="rtl" /></div>
              </div>
              <label className="check-row"><input type="checkbox" checked={editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} /><span>Visible</span></label>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
