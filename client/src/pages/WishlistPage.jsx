import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { StoreAPI } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, ProductGridSkeleton } from '../components/Common.jsx';
import { IconHeart } from '../components/Icons.jsx';

export default function WishlistPage() {
  const { user } = useAuth();
  const { items, ids } = useWishlist();
  const { t } = useUI();
  const [guestProducts, setGuestProducts] = useState(null);

  // For guests we only have ids; fetch full products for display.
  useEffect(() => {
    if (user) return;
    if (ids.length === 0) { setGuestProducts([]); return; }
    // small catalog: fetch and filter by wishlist ids
    StoreAPI.products('limit=60').then((d) => {
      setGuestProducts(d.products.filter((p) => ids.includes(p.id)));
    }).catch(() => setGuestProducts([]));
  }, [user, ids]);

  const list = user ? items : guestProducts;
  const loading = list === null;

  if (loading) return <div className="page container"><h1 className="page-title">{t('wishlist')}</h1><ProductGridSkeleton count={4} /></div>;

  if (list.length === 0) {
    return (
      <div className="page container">
        <EmptyState icon={<IconHeart size={40} />} title={t('wishlist')} text={t('emptyWishlist')}
          action={<Link to="/shop" className="btn btn-primary">{t('startShopping')}</Link>} />
      </div>
    );
  }

  return (
    <div className="page container">
      <h1 className="page-title">{t('wishlist')}</h1>
      <div className="product-grid">
        {list.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
