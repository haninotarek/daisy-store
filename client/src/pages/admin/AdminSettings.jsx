import { useEffect, useState } from 'react';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { Spinner } from '../../components/Common.jsx';

export default function AdminSettings() {
  const { toast, setSettings } = useUI();
  const [s, setS] = useState(null);
  const [govs, setGovs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingGovs, setSavingGovs] = useState(false);

  useEffect(() => {
    AdminAPI.settings().then((d) => setS(d.settings));
    AdminAPI.governorates().then((d) => setGovs(d.governorates)).catch(() => setGovs([]));
  }, []);

  const set = (k) => (e) => setS((cur) => ({ ...cur, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await AdminAPI.updateSettings(s);
      setSettings(d.settings);
      toast('Settings saved');
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  const setGov = (id, key, val) => setGovs((list) => list.map((g) => (g.id === id ? { ...g, [key]: val } : g)));

  const applyToAll = () => {
    const first = govs[0]?.fee;
    if (first == null) return;
    setGovs((list) => list.map((g) => ({ ...g, fee: first })));
  };

  const saveGovs = async () => {
    setSavingGovs(true);
    try {
      const d = await AdminAPI.updateGovernorates(govs.map((g) => ({ id: g.id, fee: g.fee, active: g.active })));
      setGovs(d.governorates);
      toast('Delivery fees saved');
    } catch (err) { toast(err.message, 'error'); }
    setSavingGovs(false);
  };

  if (!s) return <Spinner center />;

  return (
    <div className="admin-page">
      <h1 className="admin-h1">Store Settings</h1>
      <form onSubmit={save} className="admin-form">
        <section className="admin-card">
          <h3>Brand</h3>
          <div className="grid-2">
            <div className="field"><label>Store Name</label><input value={s.storeName} onChange={set('storeName')} /></div>
            <div className="field"><label>Logo</label><ImageUploader single value={s.logo} onChange={(url) => setS((c) => ({ ...c, logo: url }))} /></div>
          </div>
        </section>

        <section className="admin-card">
          <h3>Contact & Social</h3>
          <div className="grid-2">
            <div className="field"><label>WhatsApp (with country code)</label><input value={s.whatsapp} onChange={set('whatsapp')} placeholder="201000000000" dir="ltr" /></div>
            <div className="field"><label>Phone</label><input value={s.phone} onChange={set('phone')} dir="ltr" /></div>
            <div className="field"><label>Instagram</label><input value={s.instagram} onChange={set('instagram')} dir="ltr" /></div>
            <div className="field"><label>Facebook</label><input value={s.facebook} onChange={set('facebook')} dir="ltr" /></div>
            <div className="field"><label>Email</label><input value={s.email} onChange={set('email')} dir="ltr" /></div>
            <div className="field"><label>Address</label><input value={s.address} onChange={set('address')} /></div>
          </div>
        </section>

        <section className="admin-card">
          <h3>Store</h3>
          <div className="grid-3">
            <div className="field">
              <label>Default Delivery Fee</label>
              <input type="number" value={s.deliveryFee} onChange={set('deliveryFee')} />
              <span className="muted admin-hint" style={{ margin: '6px 0 0' }}>Fallback used only for governorates with no fee set.</span>
            </div>
            <div className="field"><label>Currency</label><input value={s.currency} onChange={set('currency')} /></div>
            <div className="field"><label>Low-stock Threshold</label><input type="number" value={s.lowStockThreshold} onChange={set('lowStockThreshold')} /></div>
          </div>
        </section>

        <div className="admin-form-actions"><button className="btn btn-primary" disabled={saving}>{saving ? <span className="spin" /> : 'Save Settings'}</button></div>
      </form>

      {/* Governorate-based delivery fees */}
      <section className="admin-card">
        <div className="admin-card-head">
          <h3>Delivery Fees by Governorate</h3>
          {govs && <button type="button" className="btn btn-outline btn-sm" onClick={applyToAll}>Apply first fee to all</button>}
        </div>
        <p className="muted admin-hint">Set the delivery fee for each governorate. At checkout the customer picks a governorate and the fee is applied automatically. Turn a governorate off to stop delivering there.</p>
        {!govs ? <Spinner center /> : (
          <>
            <div className="gov-grid">
              {govs.map((g) => (
                <div key={g.id} className={`gov-row ${g.active ? '' : 'off'}`}>
                  <span className="gov-name">{g.nameEn} <span className="muted">{g.nameAr}</span></span>
                  <div className="gov-controls">
                    <input type="number" min="0" value={g.fee} onChange={(e) => setGov(g.id, 'fee', Number(e.target.value))} />
                    <button type="button" className={`toggle ${g.active ? 'on' : ''}`} onClick={() => setGov(g.id, 'active', !g.active)} title="Deliver here"><span /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-form-actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={saveGovs} disabled={savingGovs}>{savingGovs ? <span className="spin" /> : 'Save Delivery Fees'}</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
