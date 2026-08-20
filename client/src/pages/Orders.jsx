import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { EmptyState, Spinner } from '../components/Common.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { IconClipboard, IconUser, IconHeart, IconLogout } from '../components/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Orders() {
  const { t, L, money } = useUI();
  const { logout } = useAuth();
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { OrderAPI.mine().then((d) => setOrders(d.orders)).catch(() => setOrders([])); }, []);

  return (
    <div className="page container account">
      <h1 className="page-title">{t('myOrders')}</h1>
      <div className="account-layout">
        <aside className="account-nav">
          <Link to="/account" className="account-link"><IconUser size={18} /> {t('personalInfo')}</Link>
          <Link to="/account/orders" className="account-link active"><IconClipboard size={18} /> {t('myOrders')}</Link>
          <Link to="/wishlist" className="account-link"><IconHeart size={18} /> {t('wishlist')}</Link>
          <button className="account-link" onClick={logout}><IconLogout size={18} /> {t('logout')}</button>
        </aside>
        <div className="account-content">
          {orders === null ? <Spinner center />
            : orders.length === 0 ? <EmptyState icon={<IconClipboard size={40} />} title={t('myOrders')} text={t('noOrders')} action={<Link to="/shop" className="btn btn-primary">{t('startShopping')}</Link>} />
            : (
              <div className="orders-list">
                {orders.map((o) => (
                  <div key={o.id} className="order-row">
                    <div className="order-row-head" onClick={() => setOpen(open === o.id ? null : o.id)}>
                      <div>
                        <strong>{o.orderNumber}</strong>
                        <div className="muted">{new Date(o.createdAt).toLocaleDateString()} · {o.items.length} {t('items')}</div>
                      </div>
                      <div className="order-row-right">
                        <StatusBadge status={o.status} />
                        <span className="order-total">{money(o.total)}</span>
                      </div>
                    </div>
                    {open === o.id && (
                      <div className="order-row-body fade-in">
                        {o.items.map((it) => (
                          <div key={it.id} className="confirm-item">
                            <div className="confirm-item-img">{it.image && <img src={it.image} alt="" />}</div>
                            <div className="confirm-item-info"><span>{L(it, 'name')}</span>{it.variantLabel && <span className="muted">{it.variantLabel}</span>}<span className="muted">× {it.quantity}</span></div>
                            <span>{money(it.lineTotal)}</span>
                          </div>
                        ))}
                        <div className="divider" />
                        <div className="summary-row"><span>{t('delivery')}</span><span>{money(o.deliveryFee)}</span></div>
                        <div className="summary-row summary-total"><span>{t('total')}</span><span>{money(o.total)}</span></div>
                        <p className="muted" style={{ marginTop: 8 }}>{o.address}, {o.city}, {o.governorate}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
