import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import {
  IconGrid, IconBox, IconTag, IconClipboard, IconLayout, IconImage,
  IconSettings, IconFile, IconUsers, IconLogout, IconMenu, IconClose, IconSun, IconMoon,
} from '../components/Icons.jsx';

const links = [
  { to: '/admin', end: true, icon: IconGrid, label: 'Dashboard' },
  { to: '/admin/products', icon: IconBox, label: 'Products' },
  { to: '/admin/categories', icon: IconTag, label: 'Categories' },
  { to: '/admin/fields', icon: IconClipboard, label: 'Product Fields' },
  { to: '/admin/orders', icon: IconClipboard, label: 'Orders' },
  { to: '/admin/customers', icon: IconUsers, label: 'Customers' },
  { to: '/admin/hero', icon: IconImage, label: 'Hero Banners' },
  { to: '/admin/homepage', icon: IconLayout, label: 'Homepage' },
  { to: '/admin/settings', icon: IconSettings, label: 'Settings' },
  { to: '/admin/policies', icon: IconFile, label: 'Policies' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useUI();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin" dir="ltr">
      <button className="admin-burger" onClick={() => setOpen(true)}><IconMenu /></button>
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <Logo size={38} to="/admin" />
          <button className="admin-close" onClick={() => setOpen(false)}><IconClose /></button>
        </div>
        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="admin-nav-link" onClick={() => setOpen(false)}>
              <l.icon size={18} /> <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <button className="admin-nav-link" onClick={toggleTheme}>
            {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />} <span>Theme</span>
          </button>
          <button className="admin-nav-link" onClick={onLogout}><IconLogout size={18} /> <span>Logout</span></button>
        </div>
      </aside>
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title" />
          <div className="admin-user">
            <span className="muted">{user?.name}</span>
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View Store</a>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
