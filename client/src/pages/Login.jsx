import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t, toast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast(t('welcomeBack'));
      navigate(user.role === 'ADMIN' ? '/admin' : (location.state?.from || '/account'));
    } catch (err) { toast(err.message || t('somethingWrong'), 'error'); }
    setLoading(false);
  };

  return (
    <div className="page auth-page">
      <div className="auth-card fade-in">
        <div className="auth-head"><Logo size={56} showText={false} /><h1>{t('welcomeBack')}</h1><p className="muted">{t('signIn')}</p></div>
        <form onSubmit={submit}>
          <div className="field"><label>{t('email')}</label><input type="email" value={form.email} onChange={set('email')} required dir="ltr" /></div>
          <div className="field"><label>{t('password')}</label><input type="password" value={form.password} onChange={set('password')} required /></div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? <span className="spin" /> : t('signIn')}</button>
        </form>
        <p className="auth-alt">{t('noAccount')} <Link to="/register">{t('createAccount')}</Link></p>
      </div>
    </div>
  );
}
