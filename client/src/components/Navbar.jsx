import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { StoreAPI } from '../services/api.js';
import {
  IconSearch, IconHeart, IconBag, IconUser, IconMenu, IconClose,
  IconSun, IconMoon, IconChevronDown,
} from './Icons.jsx';

export default function Navbar() {
  const { t, L, lang, toggleLang, theme, toggleTheme } = useUI();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  useEffect(() => { StoreAPI.categories().then((d) => setCategories(d.categories)).catch(() => {}); }, []);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setCatOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; }, [menuOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) { navigate(`/search?q=${encodeURIComponent(q.trim())}`); setSearchOpen(false); setQ(''); }
  };

  return (
    <header className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-inner container">
        {/* left: mobile menu / desktop links */}
        <div className="nav-left">
          <button className="nav-icon nav-mobile-only" onClick={() => setMenuOpen(true)} aria-label={t('menu')}><IconMenu /></button>
          <nav className="nav-links nav-desktop-only">
            <NavLink to="/" end className="nav-link">{t('home')}</NavLink>
            <NavLink to="/shop" className="nav-link">{t('shop')}</NavLink>
            <div className="nav-dropdown" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
              <button className="nav-link nav-drop-btn">{t('categories')} <IconChevronDown size={15} /></button>
              {catOpen && (
                <div className="dropdown-menu fade-in">
                  {categories.map((c) => (
                    <Link key={c.id} to={`/category/${c.slug}`} className="dropdown-item">{L(c, 'name')}</Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* center: logo */}
        <div className="nav-center"><Logo size={44} /></div>

        {/* right: actions */}
        <div className="nav-right">
          <button className="nav-icon nav-desktop-only" onClick={() => setSearchOpen((s) => !s)} aria-label={t('search')}><IconSearch /></button>
          <button className="nav-icon nav-desktop-only" onClick={toggleTheme} aria-label={t('theme')}>{theme === 'light' ? <IconMoon /> : <IconSun />}</button>
          <button className="nav-icon nav-lang nav-desktop-only" onClick={toggleLang} aria-label={t('language')}>{lang === 'en' ? 'عربي' : 'EN'}</button>
          <Link to="/wishlist" className="nav-icon nav-badge-wrap nav-desktop-only" aria-label={t('wishlist')}>
            <IconHeart />{wishCount > 0 && <span className="nav-badge">{wishCount}</span>}
          </Link>
          <Link to={user ? '/account' : '/login'} className="nav-icon nav-desktop-only" aria-label={t('account')}><IconUser /></Link>
          {isAdmin && <Link to="/admin" className="nav-icon nav-desktop-only nav-admin-link" aria-label={t('admin')}>◆</Link>}

          {/* mobile: search + cart */}
          <button className="nav-icon nav-mobile-only" onClick={() => setSearchOpen((s) => !s)} aria-label={t('search')}><IconSearch /></button>
          <Link to="/cart" className="nav-icon nav-badge-wrap" aria-label={t('cart')}>
            <IconBag />{count > 0 && <span className="nav-badge">{count}</span>}
          </Link>
        </div>
      </div>

      {/* search bar */}
      {searchOpen && (
        <div className="nav-search fade-in">
          <form className="container nav-search-form" onSubmit={submitSearch}>
            <IconSearch />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t('search')}…`} />
            <button type="button" className="nav-icon" onClick={() => setSearchOpen(false)}><IconClose /></button>
          </form>
        </div>
      )}

      {/* mobile drawer */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
          <aside className="drawer fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <Logo size={40} />
              <button className="nav-icon" onClick={() => setMenuOpen(false)}><IconClose /></button>
            </div>
            <nav className="drawer-links">
              <NavLink to="/" end>{t('home')}</NavLink>
              <NavLink to="/shop">{t('shop')}</NavLink>
              <div className="drawer-section">{t('categories')}</div>
              {categories.map((c) => (
                <NavLink key={c.id} to={`/category/${c.slug}`} className="drawer-sub">{L(c, 'name')}</NavLink>
              ))}
              <div className="divider" style={{ margin: '10px 0' }} />
              <NavLink to="/wishlist">{t('wishlist')} {wishCount > 0 && `(${wishCount})`}</NavLink>
              <NavLink to={user ? '/account' : '/login'}>{user ? t('account') : t('login')}</NavLink>
              {isAdmin && <NavLink to="/admin">{t('admin')}</NavLink>}
            </nav>
            <div className="drawer-foot">
              <button className="btn btn-outline btn-sm" onClick={toggleLang}>{lang === 'en' ? 'عربي' : 'English'}</button>
              <button className="btn btn-outline btn-sm" onClick={toggleTheme}>
                {theme === 'light' ? <><IconMoon size={16} /> {t('theme')}</> : <><IconSun size={16} /> {t('theme')}</>}
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
