import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import { Spinner } from '../../components/Common.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { IconChevronLeft, IconWhatsapp } from '../../components/Icons.jsx';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { money, settings, toast } = useUI();
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => AdminAPI.order(id).then((d) => setOrder(d.order));
  useEffect(() => { load().catch(() => setOrder(false)); }, [id]);

  const changeStatus = async (status) => {
    setSaving(true);
    try { const d = await AdminAPI.updateOrderStatus(id, status); setOrder((o) => ({ ...o, status: d.order.status })); toast('Status updated'); }
    catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  if (order === null) return <Spinner center />;
  if (!order) return <p>Order not found.</p>;

  const wa = order.phone ? `https://wa.me/${order.phone.replace(/\D/g, '').replace(/^0/, '20')}?text=${encodeURIComponent(`Hi ${order.customerName}, regarding your Daisy order ${order.orderNumber}`)}` : null;

  return (
    <div className="admin-page">
      <Link to="/admin/orders" className="admin-back"><IconChevronLeft size={16} /> Orders</Link>
      <div className="admin-page-head">
        <div><h1 className="admin-h1">{order.orderNumber}</h1><p className="muted">{new Date(order.createdAt).toLocaleString()}</p></div>
        <StatusBadge status={order.status} />
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Items</h3>
          <table className="admin-table">
            <thead><tr><th></th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td><div className="admin-thumb">{it.image && <img src={it.image} alt="" />}</div></td>
                  <td>{it.nameEn}{it.variantLabel && <div className="muted">{it.variantLabel}</div>}</td>
                  <td>{it.quantity}</td><td>{money(it.unitPrice)}</td><td>{money(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divider" />
          <div className="summary-row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{money(order.deliveryFee)}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{money(order.total)}</span></div>
        </div>

        <div className="admin-side">
          <div className="admin-card">
            <h3>Customer</h3>
            <p><strong>{order.customerName}</strong></p>
            <p dir="ltr" className="muted">{order.phone}</p>
            {order.userEmail && <p className="muted">{order.userEmail}</p>}
            <p>{order.address}</p><p>{order.city}, {order.governorate}</p>
            {order.notes && <p className="muted">“{order.notes}”</p>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm" style={{ marginTop: 10 }}><IconWhatsapp size={16} /> Contact Customer</a>}
          </div>

          <div className="admin-card">
            <h3>Update Status</h3>
            <div className="status-picker">
              {STATUSES.map((s) => (
                <button key={s} disabled={saving} className={`status-opt ${order.status === s ? 'active' : ''}`} onClick={() => changeStatus(s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
