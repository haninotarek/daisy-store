import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductListing from '../components/ProductListing.jsx';
import { Breadcrumb } from '../components/Common.jsx';
import { StoreAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';

export default function CategoryPage() {
  const { slug } = useParams();
  const { t, L } = useUI();
  const [category, setCategory] = useState(null);

  useEffect(() => {
    setCategory(null);
    StoreAPI.category(slug).then((d) => setCategory(d.category)).catch(() => setCategory(false));
  }, [slug]);

  return (
    <div className="page">
      <div className="page-header" style={category?.banner ? { backgroundImage: `linear-gradient(rgba(0,0,0,.28),rgba(0,0,0,.28)), url(${category.banner})` } : undefined} data-banner={!!category?.banner}>
        <div className="container">
          <Breadcrumb items={[{ label: t('home'), to: '/' }, { label: t('shop'), to: '/shop' }, { label: category ? L(category, 'name') : '…' }]} />
          <h1>{category ? L(category, 'name') : '…'}</h1>
          {category && L(category, 'desc') && <p className="page-header-desc">{L(category, 'desc')}</p>}
        </div>
      </div>
      <div className="container">
        <ProductListing category={slug} key={slug} />
      </div>
    </div>
  );
}
