import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StoreAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Breadcrumb, Spinner, EmptyState } from '../components/Common.jsx';
import { IconHeart, IconMinus, IconPlus, IconBag, IconWhatsapp } from '../components/Icons.jsx';

export default function ProductPage() {
  const { slug } = useParams();
  const { t, L, money, settings, toast, dir } = useUI();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [selected, setSelected] = useState({}); // { fieldId: optionId }
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setData(null); setNotFound(false); setSelected({}); setQty(1); setActiveImg(0);
    StoreAPI.product(slug).then(setData).catch(() => setNotFound(true));
  }, [slug]);

  const product = data?.product;
  const variantFields = data?.variantFields || [];

  // Find the variant matching all selected options.
  const matchedVariant = useMemo(() => {
    if (!product?.hasVariants || variantFields.length === 0) return null;
    const complete = variantFields.every((f) => selected[f.id]);
    if (!complete) return null;
    return product.variants.find((v) =>
      variantFields.every((f) => v.options.find((o) => o.fieldId === f.id)?.optionId === selected[f.id])
    ) || null;
  }, [product, variantFields, selected]);

  // stock available for the current selection
  const available = product?.hasVariants
    ? (matchedVariant ? matchedVariant.stock : null)
    : product?.stock;

  useEffect(() => { setQty((q) => Math.min(Math.max(1, q), Math.max(1, available || 1))); }, [available]);

  // Which option ids are entirely out of stock (for subtle disabling).
  const optionStock = useMemo(() => {
    const map = {};
    if (product?.hasVariants) {
      for (const v of product.variants) {
        for (const o of v.options) map[o.optionId] = (map[o.optionId] || 0) + v.stock;
      }
    }
    return map;
  }, [product]);

  if (notFound) return <div className="page container"><EmptyState title={t('noResults')} action={<Link to="/shop" className="btn btn-primary">{t('shop')}</Link>} /></div>;
  if (!product) return <div className="page container"><Spinner center /></div>;

  const wished = has(product.id);
  const price = matchedVariant?.price ?? product.effectivePrice;

  const needsSelection = product.hasVariants && !matchedVariant;
  const isOut = product.hasVariants ? (matchedVariant ? matchedVariant.stock <= 0 : false) : !product.inStock;

  const onAdd = async () => {
    if (product.hasVariants && !matchedVariant) {
      toast(t('selectOptions'), 'error');
      return;
    }
    if (isOut || available <= 0) { toast(t('outOfStock'), 'error'); return; }
    setAdding(true);
    try {
      const variant = matchedVariant ? {
        ...matchedVariant,
        optionLabels: variantFields.map((f) => {
          const opt = f.options.find((o) => o.id === selected[f.id]);
          return { fieldNameEn: f.nameEn, fieldNameAr: f.nameAr, valueEn: opt?.valueEn, valueAr: opt?.valueAr };
        }),
      } : null;
      await addItem(product, variant, qty);
      toast(t('addedToCart'));
    } catch (err) { toast(err.message || t('somethingWrong'), 'error'); }
    setAdding(false);
  };

  const wa = settings?.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`${L(product, 'name')} — ${window.location.href}`)}`
    : null;

  return (
    <div className="page product-page">
      <div className="container">
        <Breadcrumb items={[
          { label: t('home'), to: '/' },
          product.category && { label: L(product.category, 'name'), to: `/category/${product.category.slug}` },
          { label: L(product, 'name') },
        ].filter(Boolean)} />

        <div className="product-layout">
          {/* Gallery */}
          <div className="gallery">
            <div className="gallery-main" onClick={() => setZoom(true)}>
              {product.images[activeImg]
                ? <img src={product.images[activeImg].url} alt={L(product, 'name')} />
                : <div className="skeleton" style={{ aspectRatio: '3/4' }} />}
              {product.onSale && <span className="badge badge-sale gallery-badge">-{product.discountPercent}%</span>}
            </div>
            {product.images.length > 1 && (
              <div className="gallery-thumbs">
                {product.images.map((im, i) => (
                  <button key={im.id} className={`thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={im.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            {product.category && <Link to={`/category/${product.category.slug}`} className="product-cat">{L(product.category, 'name')}</Link>}
            <h1 className="product-title">{L(product, 'name')}</h1>

            <div className="product-price price">
              <span className="now">{money(price)}</span>
              {product.onSale && <span className="was">{money(product.price)}</span>}
            </div>

            {/* stock badge */}
            <div className="product-stock">
              {isOut ? <span className="badge badge-out">{t('outOfStock')}</span>
                : available != null && available <= (settings?.lowStockThreshold ?? 5)
                  ? <span className="badge badge-new">{t('lowStock', { n: available })}</span>
                  : !needsSelection && <span className="stock-in">● {t('inStock')}</span>}
            </div>

            {L(product, 'desc') && <p className="product-desc">{L(product, 'desc')}</p>}

            {/* Static attributes */}
            {product.attributes.length > 0 && (
              <ul className="attr-list">
                {product.attributes.map((a) => (
                  <li key={a.fieldId}><span className="attr-key">{L(a, 'name')}:</span> <span className="attr-val">{a.colorHex && <i className="attr-dot" style={{ background: a.colorHex }} />}{L(a, 'value')}</span></li>
                ))}
              </ul>
            )}

            {/* Variant selectors */}
            {variantFields.map((f) => (
              <div key={f.id} className="variant-group">
                <div className="variant-label">{L(f, 'name')}{selected[f.id] && <span className="variant-selected">{L(f.options.find((o) => o.id === selected[f.id]), 'value')}</span>}</div>
                {f.type === 'COLOR' ? (
                  <div className="swatch-row">
                    {f.options.map((o) => (
                      <button key={o.id} title={L(o, 'value')}
                        className={`swatch swatch-lg ${selected[f.id] === o.id ? 'active' : ''} ${optionStock[o.id] === 0 ? 'disabled' : ''}`}
                        style={{ background: o.colorHex || '#ccc' }}
                        onClick={() => setSelected((s) => ({ ...s, [f.id]: o.id }))} aria-label={L(o, 'value')} />
                    ))}
                  </div>
                ) : (
                  <div className="option-row">
                    {f.options.map((o) => (
                      <button key={o.id}
                        className={`option-chip ${selected[f.id] === o.id ? 'active' : ''} ${optionStock[o.id] === 0 ? 'disabled' : ''}`}
                        onClick={() => setSelected((s) => ({ ...s, [f.id]: o.id }))}>
                        {L(o, 'value')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Quantity + actions */}
            <div className="product-actions">
              <div className="qty-selector">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="decrease"><IconMinus size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(available || 99, q + 1))} disabled={available != null && qty >= available} aria-label="increase"><IconPlus size={16} /></button>
              </div>
              <button className="btn btn-primary product-add" onClick={onAdd} disabled={adding || isOut}>
                {adding ? <span className="spin" /> : <><IconBag size={18} /> {needsSelection ? t('selectOptions') : isOut ? t('outOfStock') : t('addToCart')}</>}
              </button>
              <button className={`btn btn-outline product-wish ${wished ? 'active' : ''}`} onClick={() => toggle(product)} aria-label={t('wishlist')}>
                <IconHeart size={18} filled={wished} />
              </button>
            </div>

            {wa && <a href={wa} target="_blank" rel="noreferrer" className="product-whatsapp"><IconWhatsapp size={18} /> {t('chatWhatsapp')}</a>}
          </div>
        </div>

        {/* Related */}
        {data.related?.length > 0 && (
          <section className="section-tight related">
            <div className="section-head"><h2>{t('relatedProducts')}</h2></div>
            <div className="product-grid">
              {data.related.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Fullscreen viewer */}
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)}>
          <img src={product.images[activeImg]?.url} alt={L(product, 'name')} />
        </div>
      )}
    </div>
  );
}
