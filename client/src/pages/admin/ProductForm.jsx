import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminAPI } from '../../services/api.js';
import { useUI } from '../../context/UIContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { Spinner } from '../../components/Common.jsx';
import { IconChevronLeft } from '../../components/Icons.jsx';

// cartesian product of arrays
const cartesian = (arrs) => arrs.reduce((acc, cur) => acc.flatMap((a) => cur.map((c) => [...a, c])), [[]]);

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useUI();

  const [categories, setCategories] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nameEn: '', nameAr: '', descEn: '', descAr: '', categoryId: '',
    price: '', salePrice: '', active: true, featured: false, isNew: false, bestSeller: false,
    hasVariants: false, stock: '',
  });
  const [images, setImages] = useState([]);
  const [staticAttrs, setStaticAttrs] = useState({});     // { fieldId: {optionId|valueText} }
  const [variantOpts, setVariantOpts] = useState({});     // { fieldId: [optionId,...] }
  const [variantStock, setVariantStock] = useState({});   // { comboKey: stock }

  useEffect(() => {
    Promise.all([AdminAPI.categories(), AdminAPI.fields()]).then(([c, f]) => {
      setCategories(c.categories); setFields(f.fields);
    });
  }, []);

  useEffect(() => {
    if (!editing) return;
    AdminAPI.product(id).then(({ product, raw }) => {
      setForm({
        nameEn: product.nameEn, nameAr: product.nameAr, descEn: product.descEn, descAr: product.descAr,
        categoryId: product.category?.id || '', price: product.price, salePrice: product.salePrice ?? '',
        active: product.active, featured: product.featured, isNew: product.isNew, bestSeller: product.bestSeller,
        hasVariants: product.hasVariants, stock: product.hasVariants ? '' : product.stock,
      });
      setImages(product.images.map((im) => ({ url: im.url, isMain: im.isMain })));
      // static attributes
      const sa = {};
      raw.attributes.forEach((a) => { sa[a.fieldId] = a.optionId ? { optionId: a.optionId } : { valueText: a.valueText }; });
      setStaticAttrs(sa);
      // variant options + stocks
      const vo = {}; const vs = {};
      raw.variants.forEach((v) => {
        const key = v.options.map((o) => o.optionId).sort().join('|');
        vs[key] = v.stock;
        v.options.forEach((o) => { vo[o.fieldId] = vo[o.fieldId] || []; if (!vo[o.fieldId].includes(o.optionId)) vo[o.fieldId].push(o.optionId); });
      });
      setVariantOpts(vo); setVariantStock(vs);
      setLoading(false);
    }).catch(() => { toast('Product not found', 'error'); navigate('/admin/products'); });
  }, [editing, id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Fields applicable to the selected category (global fields have no categories).
  const applicableFields = useMemo(() => {
    if (!form.categoryId) return [];
    return fields.filter((f) => f.active && (f.categoryIds.length === 0 || f.categoryIds.includes(form.categoryId)));
  }, [fields, form.categoryId]);

  const variantFields = applicableFields.filter((f) => f.usedForVariants);
  const staticFields = applicableFields.filter((f) => !f.usedForVariants);

  // Build variant combinations from chosen options.
  const combos = useMemo(() => {
    const chosen = variantFields.map((f) => (variantOpts[f.id] || []).map((oid) => ({ fieldId: f.id, optionId: oid })));
    if (chosen.some((c) => c.length === 0)) return [];
    return cartesian(chosen);
  }, [variantFields, variantOpts]);

  const optLabel = (fieldId, optionId) => {
    const f = fields.find((x) => x.id === fieldId);
    const o = f?.options.find((x) => x.id === optionId);
    return o?.valueEn || '';
  };
  const comboKey = (combo) => combo.map((c) => c.optionId).sort().join('|');
  const comboLabel = (combo) => combo.map((c) => optLabel(c.fieldId, c.optionId)).join(' / ');

  const toggleVariantOpt = (fieldId, optionId) => {
    setVariantOpts((prev) => {
      const cur = prev[fieldId] || [];
      return { ...prev, [fieldId]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.nameEn || !form.nameAr) return toast('Name (Arabic & English) is required', 'error');
    if (!form.price) return toast('Price is required', 'error');
    setSaving(true);

    const attributes = Object.entries(staticAttrs)
      .filter(([, v]) => v && (v.optionId || v.valueText))
      .map(([fieldId, v]) => ({ fieldId, optionId: v.optionId || null, valueText: v.valueText || null }));

    const variants = form.hasVariants ? combos.map((combo) => ({
      options: combo, stock: Number(variantStock[comboKey(combo)]) || 0, label: comboLabel(combo),
    })) : [];

    const payload = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      stock: form.hasVariants ? 0 : Number(form.stock) || 0,
      images, attributes, variants,
    };

    try {
      if (editing) await AdminAPI.updateProduct(id, payload);
      else await AdminAPI.createProduct(payload);
      toast(editing ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) { toast(err.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  if (loading) return <Spinner center />;

  return (
    <div className="admin-page">
      <Link to="/admin/products" className="admin-back"><IconChevronLeft size={16} /> Products</Link>
      <h1 className="admin-h1">{editing ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={save} className="admin-form">
        {/* Basic */}
        <section className="admin-card">
          <h3>Basic Information</h3>
          <div className="grid-2">
            <div className="field"><label>Name (English)</label><input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} /></div>
            <div className="field"><label>Name (Arabic)</label><input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} dir="rtl" /></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Description (English)</label><textarea value={form.descEn} onChange={(e) => set('descEn', e.target.value)} /></div>
            <div className="field"><label>Description (Arabic)</label><textarea value={form.descAr} onChange={(e) => set('descAr', e.target.value)} dir="rtl" /></div>
          </div>
          <div className="grid-3">
            <div className="field"><label>Category</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
            </div>
            <div className="field"><label>Price (EGP)</label><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
            <div className="field"><label>Sale Price (optional)</label><input type="number" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} /></div>
          </div>
        </section>

        {/* Images */}
        <section className="admin-card">
          <h3>Images</h3>
          <ImageUploader value={images} onChange={setImages} />
        </section>

        {/* Attributes */}
        {form.categoryId && staticFields.length > 0 && (
          <section className="admin-card">
            <h3>Attributes</h3>
            <p className="muted admin-hint">These fields are configured for this category. They appear on the product page.</p>
            <div className="grid-2">
              {staticFields.map((f) => (
                <div key={f.id} className="field">
                  <label>{f.nameEn} <span className="muted">/ {f.nameAr}</span></label>
                  {['SELECT', 'COLOR', 'SIZE'].includes(f.type) ? (
                    <select value={staticAttrs[f.id]?.optionId || ''} onChange={(e) => setStaticAttrs((s) => ({ ...s, [f.id]: { optionId: e.target.value } }))}>
                      <option value="">—</option>
                      {f.options.map((o) => <option key={o.id} value={o.id}>{o.valueEn}</option>)}
                    </select>
                  ) : f.type === 'BOOLEAN' ? (
                    <label className="check-row"><input type="checkbox" checked={staticAttrs[f.id]?.valueText === 'true'} onChange={(e) => setStaticAttrs((s) => ({ ...s, [f.id]: { valueText: e.target.checked ? 'true' : 'false' } }))} /><span>Yes</span></label>
                  ) : (
                    <input type={f.type === 'NUMBER' ? 'number' : 'text'} value={staticAttrs[f.id]?.valueText || ''} onChange={(e) => setStaticAttrs((s) => ({ ...s, [f.id]: { valueText: e.target.value } }))} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Variants & Inventory */}
        <section className="admin-card">
          <div className="admin-card-head">
            <h3>Variants & Inventory</h3>
            <label className="check-row"><input type="checkbox" checked={form.hasVariants} onChange={(e) => set('hasVariants', e.target.checked)} /><span>This product has variants</span></label>
          </div>

          {!form.hasVariants ? (
            <div className="field" style={{ maxWidth: 220 }}><label>Stock quantity</label><input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></div>
          ) : variantFields.length === 0 ? (
            <p className="muted">No variant fields are configured for this category. Mark a field as "Used for variants" in Product Fields (e.g. Size, Color), and attach it to this category.</p>
          ) : (
            <>
              {variantFields.map((f) => (
                <div key={f.id} className="variant-picker">
                  <label>{f.nameEn}</label>
                  <div className="option-row">
                    {f.options.map((o) => (
                      <button type="button" key={o.id} className={`option-chip ${(variantOpts[f.id] || []).includes(o.id) ? 'active' : ''}`} onClick={() => toggleVariantOpt(f.id, o.id)}>
                        {f.type === 'COLOR' && <i className="attr-dot" style={{ background: o.colorHex || '#ccc' }} />}{o.valueEn}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {combos.length > 0 && (
                <table className="admin-table variant-table">
                  <thead><tr><th>Variant</th><th>Stock</th></tr></thead>
                  <tbody>
                    {combos.map((combo) => {
                      const k = comboKey(combo);
                      return (
                        <tr key={k}>
                          <td>{comboLabel(combo)}</td>
                          <td><input type="number" min="0" value={variantStock[k] ?? ''} onChange={(e) => setVariantStock((s) => ({ ...s, [k]: e.target.value }))} style={{ width: 90 }} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>

        {/* Publishing */}
        <section className="admin-card">
          <h3>Publishing</h3>
          <div className="publish-flags">
            <label className="check-row"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /><span>Active (visible in store)</span></label>
            <label className="check-row"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /><span>Featured</span></label>
            <label className="check-row"><input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} /><span>New Arrival</span></label>
            <label className="check-row"><input type="checkbox" checked={form.bestSeller} onChange={(e) => set('bestSeller', e.target.checked)} /><span>Best Seller</span></label>
          </div>
        </section>

        <div className="admin-form-actions">
          <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
          <button className="btn btn-primary" disabled={saving}>{saving ? <span className="spin" /> : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
}
