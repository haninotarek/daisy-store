import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { EmptyState } from '../components/Common.jsx';
import { IconMinus, IconPlus, IconTrash, IconBag } from '../components/Icons.jsx';

export default function CartPage() {
  const { items, subtotal, updateItem, removeItem } = useCart();
  const { t, L, money, settings } = useUI();
  const navigate = useNavigate();

  const deliveryFee = settings?.deliveryFee ?? 0;
  const hasIssues = items.some((i) => i.outOfStock || i.exceedsStock);

  if (items.length === 0) {
    return (
      <div className="page container">
        <EmptyState icon={<IconBag size={40} />} title={t('yourCart')} text={t('emptyCart')}
          action={<Link to="/shop" className="btn btn-primary">{t('startShopping')}</Link>} />
      </div>
    );
  }

  return (
    <div className="page container">
      <h1 className="page-title">{t('yourCart')}</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((it) => (
            <div key={it.id} className={`cart-item ${it.outOfStock ? 'unavailable' : ''}`}>
              <Link to={`/products/${it.slug}`} className="cart-item-img">
                {it.image ? <img src={it.image} alt={L(it, 'name')} /> : <div className="skeleton" />}
              </Link>
              <div className="cart-item-info">
                <Link to={`/products/${it.slug}`} className="cart-item-name">{L(it, 'name')}</Link>
                {it.variantLabel && <div className="cart-item-variant muted">{it.attributes?.length
                  ? it.attributes.map((a, i) => <span key={i}>{L(a, 'fieldName')}: {L(a, 'value')}{i < it.attributes.length - 1 ? ' · ' : ''}</span>)
                  : it.variantLabel}</div>}
                <div className="cart-item-price price"><span className="now">{money(it.unitPrice)}</span></div>
                {it.outOfStock && <span className="badge badge-out">{t('outOfStock')}</span>}
                {!it.outOfStock && it.exceedsStock && <span className="field-error">{t('lowStock', { n: it.available })}</span>}
              </div>
              <div className="cart-item-controls">
                <div className="qty-selector qty-sm">
                  <button onClick={() => updateItem(it.id, it.quantity - 1)} disabled={it.quantity <= 1}><IconMinus size={14} /></button>
                  <span>{it.quantity}</span>
                  <button onClick={() => updateItem(it.id, it.quantity + 1)} disabled={it.quantity >= it.available}><IconPlus size={14} /></button>
                </div>
                <div className="cart-item-total">{money(it.lineTotal)}</div>
                <button className="cart-item-remove" onClick={() => removeItem(it.id)} aria-label={t('remove')}><IconTrash size={18} /></button>
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h3>{t('orderSummary')}</h3>
          <div className="summary-row"><span>{t('subtotal')}</span><span>{money(subtotal)}</span></div>
          <div className="summary-row"><span>{t('delivery')}</span><span>{money(deliveryFee)}</span></div>
          <div className="divider" />
          <div className="summary-row summary-total"><span>{t('total')}</span><span>{money(subtotal + deliveryFee)}</span></div>
          <button className="btn btn-primary btn-block" disabled={hasIssues} onClick={() => navigate('/checkout')}>{t('checkout')}</button>
          {hasIssues && <p className="field-error center">{t('outOfStock')}</p>}
          <Link to="/shop" className="btn btn-ghost btn-block cart-continue">{t('continueShopping')}</Link>
        </aside>
      </div>
    </div>
  );
}
