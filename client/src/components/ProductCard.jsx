import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { IconHeart, IconBag } from './Icons.jsx';

export default function ProductCard({ product }) {
  const { t, L, money, toast } = useUI();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const [adding, setAdding] = useState(false);

  const img = product.mainImage || product.images?.[0]?.url;
  const img2 = product.images?.[1]?.url;
  const wished = has(product.id);

  const onAdd = async (e) => {
    e.preventDefault();
    if (!product.inStock) return;
    if (product.hasVariants) return; // needs option selection on product page
    setAdding(true);
    try { await addItem(product, null, 1); toast(t('addedToCart')); }
    catch (err) { toast(err.message || t('somethingWrong'), 'error'); }
    setAdding(false);
  };

  return (
    <Link to={`/products/${product.slug}`} className="pcard fade-in">
      <div className="pcard-media">
        {img ? <img src={img} alt={L(product, 'name')} loading="lazy" className="pcard-img" /> : <div className="pcard-img skeleton" />}
        {img2 && <img src={img2} alt="" loading="lazy" className="pcard-img pcard-img-hover" />}

        <div className="pcard-badges">
          {product.onSale && <span className="badge badge-sale">-{product.discountPercent}%</span>}
          {product.isNew && !product.onSale && <span className="badge badge-new">{t('newArrivals')}</span>}
          {!product.inStock && <span className="badge badge-out">{t('outOfStock')}</span>}
        </div>

        <button
          className={`pcard-wish ${wished ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); toggle(product); }}
          aria-label={t('wishlist')}
        >
          <IconHeart size={18} filled={wished} />
        </button>

        {product.inStock && (
          <div className="pcard-action">
            {product.hasVariants ? (
              <span className="btn btn-primary btn-block btn-sm">{t('chooseOptions')}</span>
            ) : (
              <button className="btn btn-primary btn-block btn-sm" onClick={onAdd} disabled={adding}>
                {adding ? <span className="spin" /> : <><IconBag size={16} /> {t('addToCart')}</>}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pcard-body">
        {product.category && <span className="pcard-cat">{L(product.category, 'name')}</span>}
        <h3 className="pcard-name">{L(product, 'name')}</h3>
        <div className="price">
          <span className="now">{money(product.effectivePrice)}</span>
          {product.onSale && <span className="was">{money(product.price)}</span>}
        </div>
      </div>
    </Link>
  );
}
