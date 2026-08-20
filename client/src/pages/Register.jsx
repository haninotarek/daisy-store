import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const { register } = useAuth();
  const { t, toast } = useUI();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast(t('joinDaisy'));
      navigate('/account');
    } catch (err) { toast(err.message || t('somethingWrong'), 'error'); }
    setLoading(false);
  };

  return (
    <div className="page auth-page">
      <div className="auth-card fade-in">
        <div className="auth-head"><Logo size={56} showText={false} /><h1>{t('joinDaisy')}</h1><p className="muted">{t('createAccount')}</p></div>
        <form onSubmit={submit}>
          <div className="field"><label>{t('name')}</label><input value={form.name} onChange={set('name')} required /></div>
          <div className="field"><label>{t('email')}</label><input type="email" value={form.email} onChange={set('email')} required dir="ltr" /></div>
          <div className="field"><label>{t('phone')}</label><input value={form.phone} onChange={set('phone')} dir="ltr" /></div>
          <div className="field"><label>{t('password')}</label><input type="password" value={form.password} onChange={set('password')} required minLength={6} /></div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? <span className="spin" /> : t('createAccount')}</button>
        </form>
        <p className="auth-alt">{t('haveAccount')} <Link to="/login">{t('signIn')}</Link></p>
      </div>
    </div>
  );
}
