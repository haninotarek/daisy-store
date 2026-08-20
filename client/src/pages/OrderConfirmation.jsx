import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { OrderAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import Logo from '../components/Logo.jsx';
import { Spinner, EmptyState } from '../components/Common.jsx';
import { IconCheck } from '../components/Icons.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { t, L, money } = useUI();
  const [order, setOrder] = useState(location.state?.order || null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (order) return;
    OrderAPI.get(orderNumber).then((d) => setOrder(d.order)).catch(() => setNotFound(true));
  }, [orderNumber, order]);

  if (notFound) return <div className="page container"><EmptyState title={t('noResults')} action={<Link to="/" className="btn btn-primary">{t('home')}</Link>} /></div>;
  if (!order) return <div className="page container"><Spinner center /></div>;

  return (
    <div className="page container confirmation">
      <div className="confirm-hero fade-in">
        <div className="confirm-check"><IconCheck size={34} /></div>
        <Logo size={54} showText={false} />
        <h1>{t('orderPlaced')}</h1>
        <p className="muted">{t('thankYou')}</p>
        <div className="confirm-number">
          <span className="muted">{t('orderNumber')}</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="confirm-grid">
        <div className="confirm-card">
          <h3>{t('orderSummary')}</h3>
          {order.items.map((it) => (
            <div key={it.id} className="confirm-item">
              <div className="confirm-item-img">{it.image && <img src={it.image} alt="" />}</div>
              <div className="confirm-item-info">
                <span>{L(it, 'name')}</span>
                {it.variantLabel && <span className="muted">{it.variantLabel}</span>}
                <span className="muted">× {it.quantity}</span>
              </div>
              <span>{money(it.lineTotal)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="summary-row"><span>{t('subtotal')}</span><span>{money(order.subtotal)}</span></div>
          <div className="summary-row"><span>{t('delivery')}</span><span>{money(order.deliveryFee)}</span></div>
          <div className="summary-row summary-total"><span>{t('total')}</span><span>{money(order.total)}</span></div>
        </div>

        <div className="confirm-card">
          <h3>{t('shippingTo')}</h3>
          <p className="confirm-address">
            <strong>{order.customerName}</strong><br />
            {order.phone}<br />
            {order.address}<br />
            {order.city}, {order.governorate}
          </p>
          {order.notes && <p className="muted">“{order.notes}”</p>}
          <div className="confirm-actions">
            <Link to="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
            <Link to="/account/orders" className="btn btn-outline">{t('myOrders')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
