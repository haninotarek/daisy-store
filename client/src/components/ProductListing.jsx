import { useEffect, useState, useCallback } from 'react';
import ProductCard from './ProductCard.jsx';
import { ProductGridSkeleton, Pagination, EmptyState } from './Common.jsx';
import { StoreAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { IconClose, IconChevronDown } from './Icons.jsx';

// Reusable product listing with filters, sort, pagination.
// Props: category (slug), search (query), title
export default function ProductListing({ category, search, extraQuery }) {
  const { t, L } = useUI();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);          // available facets
  const [selected, setSelected] = useState({});         // { fieldId: [optionId] }
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setPage(1); setSelected({}); }, [category, search]);

  useEffect(() => {
    StoreAPI.filters(category).then((d) => setFilters(d.filters)).catch(() => setFilters([]));
  }, [category]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 12);
    params.set('sort', sort);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    if (inStockOnly) params.set('inStock', 'true');
    if (extraQuery) Object.entries(extraQuery).forEach(([k, v]) => params.set(k, v));
    const active = Object.fromEntries(Object.entries(selected).filter(([, v]) => v.length));
    if (Object.keys(active).length) params.set('attributes', JSON.stringify(active));
    try {
      const d = await StoreAPI.products(params.toString());
      setProducts(d.products);
      setPagination(d.pagination);
    } catch { setProducts([]); }
    setLoading(false);
  }, [page, sort, category, search, priceRange, inStockOnly, selected, extraQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleOption = (fieldId, optionId) => {
    setSelected((prev) => {
      const cur = prev[fieldId] || [];
      const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      return { ...prev, [fieldId]: next };
    });
    setPage(1);
  };

  const clearAll = () => { setSelected({}); setPriceRange({ min: '', max: '' }); setInStockOnly(false); setPage(1); };
  const activeCount = Object.values(selected).flat().length + (priceRange.min || priceRange.max ? 1 : 0) + (inStockOnly ? 1 : 0);

  const FilterPanel = (
    <div className="filter-panel">
      <div className="filter-head">
        <span>{t('filters')}</span>
        {activeCount > 0 && <button className="filter-clear" onClick={clearAll}>{t('clearFilters')}</button>}
        <button className="nav-icon filter-close-mobile" onClick={() => setShowFilters(false)}><IconClose size={18} /></button>
      </div>

      <div className="filter-group">
        <h4>{t('price')}</h4>
        <div className="price-range">
          <input type="number" placeholder="0" value={priceRange.min} onChange={(e) => { setPriceRange((p) => ({ ...p, min: e.target.value })); setPage(1); }} />
          <span>—</span>
          <input type="number" placeholder="∞" value={priceRange.max} onChange={(e) => { setPriceRange((p) => ({ ...p, max: e.target.value })); setPage(1); }} />
        </div>
      </div>

      <div className="filter-group">
        <label className="check-row">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }} />
          <span>{t('inStock')}</span>
        </label>
      </div>

      {filters.map((f) => (
        <div key={f.id} className="filter-group">
          <h4>{L(f, 'name')}</h4>
          {f.type === 'COLOR' ? (
            <div className="swatch-row">
              {f.options.map((o) => (
                <button key={o.id} title={L(o, 'value')}
                  className={`swatch ${(selected[f.id] || []).includes(o.id) ? 'active' : ''}`}
                  style={{ background: o.colorHex || '#ccc' }}
                  onClick={() => toggleOption(f.id, o.id)} aria-label={L(o, 'value')} />
              ))}
            </div>
          ) : (
            <div className="filter-options">
              {f.options.map((o) => (
                <label key={o.id} className="check-row">
                  <input type="checkbox" checked={(selected[f.id] || []).includes(o.id)} onChange={() => toggleOption(f.id, o.id)} />
                  <span>{L(o, 'value')}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="listing">
      <div className="listing-toolbar">
        <button className="btn btn-outline btn-sm filter-toggle" onClick={() => setShowFilters(true)}>
          {t('filters')} {activeCount > 0 && `(${activeCount})`}
        </button>
        <span className="listing-count muted">{pagination.total} {t('results')}</span>
        <div className="sort-select">
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label={t('sortBy')}>
            <option value="newest">{t('sortNewest')}</option>
            <option value="price_asc">{t('sortPriceLow')}</option>
            <option value="price_desc">{t('sortPriceHigh')}</option>
            <option value="bestselling">{t('sortBestselling')}</option>
            <option value="featured">{t('sortFeatured')}</option>
          </select>
          <IconChevronDown size={15} />
        </div>
      </div>

      <div className="listing-body">
        <aside className={`listing-sidebar ${showFilters ? 'open' : ''}`}>
          {showFilters && <div className="filter-backdrop" onClick={() => setShowFilters(false)} />}
          {FilterPanel}
        </aside>

        <div className="listing-main">
          {loading ? <ProductGridSkeleton count={9} />
            : products.length === 0 ? (
              <EmptyState title={t('noResults')} text={t('browseShop')}
                action={activeCount > 0 && <button className="btn btn-outline" onClick={clearAll}>{t('clearFilters')}</button>} />
            ) : (
              <>
                <div className="product-grid">
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
              </>
            )}
        </div>
      </div>
    </div>
  );
}
