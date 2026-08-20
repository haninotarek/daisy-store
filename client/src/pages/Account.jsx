import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { IconUser, IconClipboard, IconHeart, IconLogout } from '../components/Icons.jsx';

export default function Account() {
  const { user, updateProfile, logout } = useAuth();
  const { t, toast } = useUI();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const patch = { name: form.name, phone: form.phone };
      if (form.password) patch.password = form.password;
      await updateProfile(patch);
      setForm((f) => ({ ...f, password: '' }));
      toast(t('saved'));
    } catch (err) { toast(err.message || t('somethingWrong'), 'error'); }
    setSaving(false);
  };

  return (
    <div className="page container account">
      <h1 className="page-title">{t('myAccount')}</h1>
      <div className="account-layout">
        <aside className="account-nav">
          <div className="account-user"><div className="account-avatar"><IconUser size={24} /></div><div><strong>{user?.name}</strong><div className="muted">{user?.email}</div></div></div>
          <Link to="/account" className="account-link active"><IconUser size={18} /> {t('personalInfo')}</Link>
          <Link to="/account/orders" className="account-link"><IconClipboard size={18} /> {t('myOrders')}</Link>
          <Link to="/wishlist" className="account-link"><IconHeart size={18} /> {t('wishlist')}</Link>
          <button className="account-link" onClick={logout}><IconLogout size={18} /> {t('logout')}</button>
        </aside>
        <div className="account-content">
          <section className="checkout-card">
            <h3>{t('personalInfo')}</h3>
            <form onSubmit={save}>
              <div className="field"><label>{t('name')}</label><input value={form.name} onChange={set('name')} /></div>
              <div className="field"><label>{t('email')}</label><input value={user?.email} disabled dir="ltr" /></div>
              <div className="field"><label>{t('phone')}</label><input value={form.phone} onChange={set('phone')} dir="ltr" /></div>
              <div className="field"><label>{t('password')}</label><input type="password" value={form.password} onChange={set('password')} placeholder="••••••" /></div>
              <button className="btn btn-primary" disabled={saving}>{saving ? <span className="spin" /> : t('updateProfile')}</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
