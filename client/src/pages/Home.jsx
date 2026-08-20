import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { StoreAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/Common.jsx';
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '../components/Icons.jsx';

function Hero() {
  const { L, t, dir } = useUI();
  const [banners, setBanners] = useState([]);
  const [i, setI] = useState(0);
  const timer = useRef(null);

  useEffect(() => { StoreAPI.hero().then((d) => setBanners(d.banners)).catch(() => {}); }, []);
  useEffect(() => {
    if (banners.length <= 1) return;
    timer.current = setInterval(() => setI((x) => (x + 1) % banners.length), 6000);
    return () => clearInterval(timer.current);
  }, [banners]);

  if (banners.length === 0) return <div className="hero hero-skeleton skeleton" />;
  const go = (n) => setI((n + banners.length) % banners.length);
  const Prev = dir === 'rtl' ? IconChevronRight : IconChevronLeft;
  const Next = dir === 'rtl' ? IconChevronLeft : IconChevronRight;

  return (
    <section className="hero">
      {banners.map((b, idx) => (
        <div key={b.id} className={`hero-slide ${idx === i ? 'active' : ''}`} aria-hidden={idx !== i}>
          <img src={b.image} alt={L(b, 'title')} className="hero-img" />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <div className="hero-text fade-in">
              {L(b, 'label') && <span className="eyebrow hero-label">{L(b, 'label')}</span>}
              <h1 className="hero-title">{L(b, 'title')}</h1>
              {L(b, 'subtitle') && <p className="hero-sub">{L(b, 'subtitle')}</p>}
              {b.ctaLink && <Link to={b.ctaLink} className="btn btn-accent hero-cta">{L(b, 'ctaText') || t('shopNow')} <IconArrowRight size={16} /></Link>}
            </div>
          </div>
        </div>
      ))}
      {banners.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow-prev" onClick={() => go(i - 1)} aria-label="Previous"><Prev size={22} /></button>
          <button className="hero-arrow hero-arrow-next" onClick={() => go(i + 1)} aria-label="Next"><Next size={22} /></button>
          <div className="hero-dots">
            {banners.map((_, idx) => (
              <button key={idx} className={`hero-dot ${idx === i ? 'active' : ''}`} onClick={() => go(idx)} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CategorySection({ section }) {
  const { L } = useUI();
  return (
    <section className="section-tight container">
      <div className="section-head">
        <span className="eyebrow">{L(section, 'subtitle')}</span>
        <h2>{L(section, 'title')}</h2>
      </div>
      <div className="cat-grid">
        {section.categories.map((c) => (
          <Link key={c.id} to={`/category/${c.slug}`} className="cat-card">
            <div className="cat-card-media">
              {c.image ? <img src={c.image} alt={L(c, 'name')} loading="lazy" /> : <div className="skeleton" style={{ height: '100%' }} />}
            </div>
            <span className="cat-card-name">{L(c, 'name')}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ section }) {
  const { L, t } = useUI();
  if (!section.products?.length) return null;
  const viewAllLink = section.filter === 'sale' ? '/shop?sale=true'
    : section.filter === 'new' ? '/shop?isNew=true'
    : section.filter === 'bestsellers' ? '/shop?bestSeller=true'
    : section.filter === 'featured' ? '/shop?featured=true' : '/shop';
  return (
    <section className="section-tight container">
      <div className="section-head-row">
        <div>
          <span className="eyebrow">{L(section, 'subtitle')}</span>
          <h2>{L(section, 'title')}</h2>
        </div>
        <Link to={viewAllLink} className="view-all">{t('viewAll')} <IconArrowRight size={15} /></Link>
      </div>
      <div className="product-grid">
        {section.products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function EditorialSection({ section }) {
  const { L, t } = useUI();
  const cfg = section.config || {};
  return (
    <section className="editorial">
      <div className="editorial-media">
        {cfg.image && <img src={cfg.image} alt={L(section, 'title')} loading="lazy" />}
      </div>
      <div className="editorial-text">
        <span className="eyebrow">{t('featured')}</span>
        <h2>{L(section, 'title')}</h2>
        <p>{L(section, 'subtitle')}</p>
        {cfg.ctaLink && (
          <Link to={cfg.ctaLink} className="btn btn-outline">
            {L({ En: cfg.ctaTextEn, Ar: cfg.ctaTextAr }, '') || t('shopNow')}
          </Link>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [sections, setSections] = useState(null);
  useEffect(() => { StoreAPI.homepage().then((d) => setSections(d.sections)).catch(() => setSections([])); }, []);

  return (
    <div className="home">
      <Hero />
      {sections === null ? (
        <div className="section-tight container"><ProductGridSkeleton count={8} /></div>
      ) : (
        sections.map((s) => {
          if (s.type === 'CATEGORIES') return <CategorySection key={s.key} section={s} />;
          if (s.type === 'EDITORIAL') return <EditorialSection key={s.key} section={s} />;
          return <ProductSection key={s.key} section={s} />;
        })
      )}
    </div>
  );
}
