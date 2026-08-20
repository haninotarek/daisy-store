import { useSearchParams } from 'react-router-dom';
import ProductListing from '../components/ProductListing.jsx';
import { useUI } from '../context/UIContext.jsx';

export default function SearchPage() {
  const { t } = useUI();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  return (
    <div className="page">
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">{t('search')}</span>
          <h1>“{q}”</h1>
        </div>
      </div>
      <div className="container">
        <ProductListing search={q} key={q} />
      </div>
    </div>
  );
}
