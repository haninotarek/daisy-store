import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { OrderAPI, StoreAPI } from '../services/api.js';
import { EmptyState } from '../components/Common.jsx';
import { IconBag } from '../components/Icons.jsx';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { t, L, money, settings, toast } = useUI();
  const navigate = useNavigate();
  const [governorates, setGovernorates] = useState([]);
  const [form, setForm] = useState({
    customerName: user?.name || '', phone: user?.phone || '', governorateId: '', city: '', address: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { StoreAPI.governorates().then((d) => setGovernorates(d.governorates)).catch(() => setGovernorates([])); }, []);

  const selectedGov = governorates.find((g) => g.id === form.governorateId);
  // fee follows the chosen governorate; global default is the fallback
  const deliveryFee = selectedGov ? selectedGov.fee : (settings?.deliveryFee ?? 0);

  if (items.length === 0) {
    return <div className="page container"><EmptyState icon={<IconBag size={40} />} title={t('yourCart')} text={t('emptyCart')} action={<Link to="/shop" className="btn btn-primary">{t('startShopping')}</Link>} /></div>;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.customerName.trim().length < 2) e.customerName = t('fullName');
    if (form.phone.trim().length < 6) e.phone = t('phone');
    if (!form.governorateId) e.governorate = t('governorate');
    if (form.city.trim().length < 2) e.city = t('city');
    if (form.address.trim().length < 5) e.address = t('fullAddress');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, governorate: selectedGov ? selectedGov.nameEn : '' };
      // guests send their cart items; logged-in users use their server cart
      if (!user) payload.items = items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));
      const { order } = await OrderAPI.place(payload);
      clear();
      toast(t('orderPlaced'));
      navigate(`/order/${order.orderNumber}`, { state: { order } });
    } catch (err) {
      toast(err.message || t('somethingWrong'), 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="page container">
      <h1 className="page-title">{t('checkoutTitle')}</h1>
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-form">
          <section className="checkout-card">
            <h3>{t('shippingDetails')}</h3>
            <div className="field">
              <label>{t('fullName')}</label>
              <input value={form.customerName} onChange={set('customerName')} />
              {errors.customerName && <span className="field-error">{errors.customerName}</span>}
            </div>
            <div className="grid-2">
              <div className="field">
                <label>{t('phone')}</label>
                <input value={form.phone} onChange={set('phone')} inputMode="tel" dir="ltr" />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
              <div className="field">
                <label>{t('governorate')}</label>
                <select value={form.governorateId} onChange={set('governorateId')}>
                  <option value="">—</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>{L(g, 'name')} — {money(g.fee)}</option>
                  ))}
                </select>
                {errors.governorate && <span className="field-error">{errors.governorate}</span>}
              </div>
            </div>
            <div className="field">
              <label>{t('city')}</label>
              <input value={form.city} onChange={set('city')} />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>
            <div className="field">
              <label>{t('fullAddress')}</label>
              <textarea value={form.address} onChange={set('address')} rows={3} />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>
            <div className="field">
              <label>{t('notes')}</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} />
            </div>
          </section>

          <section className="checkout-card">
            <h3>{t('paymentMethod')}</h3>
            <label className="pay-option active">
              <input type="radio" checked readOnly />
              <span>{t('cashOnDelivery')}</span>
            </label>
          </section>
        </div>

        <aside className="checkout-summary">
          <h3>{t('orderSummary')}</h3>
          <div className="checkout-items">
            {items.map((it) => (
              <div key={it.id} className="checkout-item">
                <div className="checkout-item-img">{it.image && <img src={it.image} alt="" />}<span className="checkout-item-qty">{it.quantity}</span></div>
                <div className="checkout-item-info">
                  <span className="checkout-item-name">{L(it, 'name')}</span>
                  {it.variantLabel && <span className="muted">{it.variantLabel}</span>}
                </div>
                <span className="checkout-item-total">{money(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="summary-row"><span>{t('subtotal')}</span><span>{money(subtotal)}</span></div>
          <div className="summary-row">
            <span>{t('delivery')}{selectedGov && <span className="muted"> · {L(selectedGov, 'name')}</span>}</span>
            <span>{selectedGov ? money(deliveryFee) : <span className="muted">{t('selectGovHint')}</span>}</span>
          </div>
          <div className="summary-row summary-total"><span>{t('total')}</span><span>{money(subtotal + (selectedGov ? deliveryFee : 0))}</span></div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <span className="spin" /> : t('placeOrder')}
          </button>
        </aside>
      </form>
    </div>
  );
}
