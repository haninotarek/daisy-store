import { useSearchParams } from 'react-router-dom';
import ProductListing from '../components/ProductListing.jsx';
import { useUI } from '../context/UIContext.jsx';

export default function Shop() {
  const { t } = useUI();
  const [params] = useSearchParams();
  const extra = {};
  for (const key of ['featured', 'isNew', 'bestSeller', 'sale']) {
    if (params.get(key)) extra[key] = params.get(key);
  }
  const heading = params.get('sale') ? t('onSale')
    : params.get('isNew') ? t('newArrivals')
    : params.get('bestSeller') ? t('bestSellers')
    : params.get('featured') ? t('featured') : t('shop');

  return (
    <div className="page">
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">Daisy</span>
          <h1>{heading}</h1>
        </div>
      </div>
      <div className="container">
        <ProductListing extraQuery={extra} key={JSON.stringify(extra)} />
      </div>
    </div>
  );
}
