import { useUI } from '../context/UIContext.jsx';
import { IconWhatsapp, IconInstagram, IconFacebook } from '../components/Icons.jsx';

export default function Contact() {
  const { t, settings } = useUI();
  const wa = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : null;
  return (
    <div className="page container">
      <div className="page-header-simple"><span className="eyebrow">Daisy</span><h1>{t('contact')}</h1></div>
      <div className="contact-grid">
        <div className="contact-info">
          {settings?.phone && <div className="contact-row"><span className="muted">{t('phone')}</span><a href={`tel:${settings.phone}`} dir="ltr">{settings.phone}</a></div>}
          {settings?.email && <div className="contact-row"><span className="muted">{t('email')}</span><a href={`mailto:${settings.email}`}>{settings.email}</a></div>}
          {settings?.address && <div className="contact-row"><span className="muted">Address</span><span>{settings.address}</span></div>}
          <div className="contact-social">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-accent"><IconWhatsapp size={18} /> {t('chatWhatsapp')}</a>}
          </div>
          <div className="contact-social">
            {settings?.instagram && <a href={`https://instagram.com/${settings.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="nav-icon"><IconInstagram /></a>}
            {settings?.facebook && <a href={`https://facebook.com/${settings.facebook}`} target="_blank" rel="noreferrer" className="nav-icon"><IconFacebook /></a>}
          </div>
        </div>
      </div>
    </div>
  );
}
