import { useEffect, useState } from 'react';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { ConfirmModal, Spinner } from '../../components/Common.jsx';
import { IconEdit, IconTrash, IconImage, IconClose } from '../../components/Icons.jsx';

const empty = { image: '', labelEn: '', labelAr: '', titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', ctaTextEn: '', ctaTextAr: '', ctaLink: '', displayOrder: 0, active: true };

export default function AdminHero() {
  const { toast } = useUI();
  const [banners, setBanners] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => AdminAPI.hero().then((d) => setBanners(d.banners));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!editing.image) return toast('Please upload an image', 'error');
    try { editing.id ? await AdminAPI.updateHero(editing.id, editing) : await AdminAPI.createHero(editing); toast('Saved'); setEditing(null); load(); }
    catch (err) { toast(err.message, 'error'); }
  };
  const del = async () => { try { await AdminAPI.deleteHero(confirmDel.id); setConfirmDel(null); load(); } catch (e) { toast(e.message, 'error'); } };

  if (!banners) return <Spinner center />;

  return (
    <div className="admin-page">
      <div className="admin-page-head"><h1 className="admin-h1">Hero Banners</h1><button className="btn btn-primary" onClick={() => setEditing({ ...empty, displayOrder: banners.length })}><IconImage size={16} /> Add Slide</button></div>

      <div className="hero-admin-grid">
        {banners.map((b) => (
          <div key={b.id} className="hero-admin-card">
            <div className="hero-admin-img">{b.image && <img src={b.image} alt="" />}{!b.active && <span className="badge badge-out hero-admin-off">Hidden</span>}</div>
            <div className="hero-admin-body">
              <strong>{b.titleEn || '(no title)'}</strong>
              <span className="muted">{b.labelEn} · order {b.displayOrder}</span>
              <div className="admin-row-actions"><button className="icon-btn" onClick={() => setEditing({ ...b })}><IconEdit size={16} /></button><button className="icon-btn danger" onClick={() => setConfirmDel(b)}><IconTrash size={16} /></button></div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="muted">No hero slides yet.</p>}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{editing.id ? 'Edit' : 'Add'} Slide</h3><button className="nav-icon" onClick={() => setEditing(null)}><IconClose /></button></div>
            <form onSubmit={save} className="modal-body">
              <div className="field"><label>Image</label><ImageUploader single value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} /></div>
              <div className="grid-2">
                <div className="field"><label>Label (English)</label><input value={editing.labelEn} onChange={(e) => setEditing({ ...editing, labelEn: e.target.value })} placeholder="New Collection" /></div>
                <div className="field"><label>Label (Arabic)</label><input value={editing.labelAr} onChange={(e) => setEditing({ ...editing, labelAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Title (English)</label><input value={editing.titleEn} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} /></div>
                <div className="field"><label>Title (Arabic)</label><input value={editing.titleAr} onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Subtitle (English)</label><input value={editing.subtitleEn} onChange={(e) => setEditing({ ...editing, subtitleEn: e.target.value })} /></div>
                <div className="field"><label>Subtitle (Arabic)</label><input value={editing.subtitleAr} onChange={(e) => setEditing({ ...editing, subtitleAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid-3">
                <div className="field"><label>CTA Text (English)</label><input value={editing.ctaTextEn} onChange={(e) => setEditing({ ...editing, ctaTextEn: e.target.value })} placeholder="Shop Collection" /></div>
                <div className="field"><label>CTA Text (Arabic)</label><input value={editing.ctaTextAr} onChange={(e) => setEditing({ ...editing, ctaTextAr: e.target.value })} dir="rtl" /></div>
                <div className="field"><label>CTA Link</label><input value={editing.ctaLink} onChange={(e) => setEditing({ ...editing, ctaLink: e.target.value })} placeholder="/shop or /category/dresses" /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Display Order</label><input type="number" value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })} /></div>
                <div className="field"><label>Status</label><label className="check-row"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /><span>Active</span></label></div>
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">Save Slide</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmDel} danger title="Delete slide?" onConfirm={del} onCancel={() => setConfirmDel(null)} confirmLabel="Delete" />
    </div>
  );
}
