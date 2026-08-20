import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';
import { useUI } from '../context/UIContext.jsx';
import { StoreAPI } from '../services/api.js';
import { IconInstagram, IconFacebook, IconWhatsapp } from './Icons.jsx';

export default function Footer() {
  const { t, L, settings } = useUI();
  const [categories, setCategories] = useState([]);
  useEffect(() => { StoreAPI.categories().then((d) => setCategories(d.categories.slice(0, 6))).catch(() => {}); }, []);

  const wa = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : null;
  const ig = settings?.instagram ? `https://instagram.com/${settings.instagram.replace('@', '')}` : null;
  const fb = settings?.facebook ? `https://facebook.com/${settings.facebook}` : null;

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo size={64} showText={false} />
          <p className="footer-tag">{settings?.storeName || 'Daisy'}</p>
          <p className="muted footer-desc">
            {L({ En: 'Elegant women’s fashion — effortless, timeless, yours.', Ar: 'أزياء نسائية أنيقة — بسيطة، خالدة، لكِ.' }, '')}
          </p>
          <div className="footer-social">
            {ig && <a href={ig} target="_blank" rel="noreferrer" aria-label="Instagram"><IconInstagram /></a>}
            {fb && <a href={fb} target="_blank" rel="noreferrer" aria-label="Facebook"><IconFacebook /></a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconWhatsapp /></a>}
          </div>
        </div>

        <div className="footer-col">
          <h4>{t('shop')}</h4>
          <Link to="/shop">{t('shop')}</Link>
          {categories.map((c) => <Link key={c.id} to={`/category/${c.slug}`}>{L(c, 'name')}</Link>)}
        </div>

        <div className="footer-col">
          <h4>{t('customerService')}</h4>
          <Link to="/contact">{t('contact')}</Link>
          <Link to="/policy/shipping">{t('shippingPolicy')}</Link>
          <Link to="/policy/return">{t('returnPolicy')}</Link>
          <Link to="/account/orders">{t('myOrders')}</Link>
        </div>

        <div className="footer-col">
          <h4>{t('followUs')}</h4>
          <Link to="/policy/privacy">{t('privacyPolicy')}</Link>
          <Link to="/policy/terms">{t('terms')}</Link>
          <Link to="/wishlist">{t('wishlist')}</Link>
          {settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
        </div>
      </div>

      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="whatsapp-float" aria-label={t('chatWhatsapp')}>
          <IconWhatsapp size={26} />
        </a>
      )}

      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} {settings?.storeName || 'Daisy'}. {t('rights')}.</span>
        </div>
      </div>
    </footer>
  );
}
