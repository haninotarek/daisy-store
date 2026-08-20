import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import Logo from '../../components/Logo.jsx';

export default function AdminLogin() {
  const { login, user, ready } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (ready && user?.role === 'ADMIN') navigate('/admin'); }, [ready, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form);
      if (u.role !== 'ADMIN') { toast('This account is not an admin.', 'error'); setLoading(false); return; }
      navigate('/admin');
    } catch (err) { toast(err.message || 'Login failed', 'error'); }
    setLoading(false);
  };

  return (
    <div className="admin-login" dir="ltr">
      <div className="auth-card fade-in">
        <div className="auth-head"><Logo size={56} showText={false} /><h1>Daisy Admin</h1><p className="muted">Sign in to your dashboard</p></div>
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></div>
          <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required /></div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? <span className="spin" /> : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
