import { useEffect, useState } from 'react';
import { StoreAPI, AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import { Spinner } from '../../components/Common.jsx';

const KEYS = [
  { key: 'shipping', label: 'Shipping Policy' },
  { key: 'return', label: 'Return Policy' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'terms', label: 'Terms & Conditions' },
];

export default function AdminPolicies() {
  const { toast } = useUI();
  const [policies, setPolicies] = useState(null);
  const [active, setActive] = useState('shipping');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    StoreAPI.policies().then((d) => {
      const map = {};
      KEYS.forEach((k) => {
        const p = d.policies.find((x) => x.key === k.key);
        map[k.key] = p || { key: k.key, titleEn: k.label, titleAr: k.label, contentEn: '', contentAr: '' };
      });
      setPolicies(map);
    });
  }, []);

  const cur = policies?.[active];
  const set = (k, v) => setPolicies((p) => ({ ...p, [active]: { ...p[active], [k]: v } }));

  const save = async () => {
    setSaving(true);
    try { await AdminAPI.updatePolicy(active, cur); toast('Policy saved'); }
    catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  if (!policies) return <Spinner center />;

  return (
    <div className="admin-page">
      <h1 className="admin-h1">Policies</h1>
      <div className="admin-tabs">
        {KEYS.map((k) => <button key={k.key} className={`admin-tab ${active === k.key ? 'active' : ''}`} onClick={() => setActive(k.key)}>{k.label}</button>)}
      </div>
      <div className="admin-card">
        <div className="grid-2">
          <div className="field"><label>Title (English)</label><input value={cur.titleEn} onChange={(e) => set('titleEn', e.target.value)} /></div>
          <div className="field"><label>Title (Arabic)</label><input value={cur.titleAr} onChange={(e) => set('titleAr', e.target.value)} dir="rtl" /></div>
        </div>
        <div className="field"><label>Content (English)</label><textarea rows={8} value={cur.contentEn} onChange={(e) => set('contentEn', e.target.value)} /></div>
        <div className="field"><label>Content (Arabic)</label><textarea rows={8} value={cur.contentAr} onChange={(e) => set('contentAr', e.target.value)} dir="rtl" /></div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spin" /> : 'Save Policy'}</button>
      </div>
    </div>
  );
}
