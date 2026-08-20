// Centralized API layer. All network calls go through request().
// In production (Vercel) VITE_API_URL points at the Render backend; in local
// dev it is empty and Vite proxies /api and /uploads to localhost:5000.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE = `${API_ORIGIN}/api`;

let authToken = localStorage.getItem('daisy_token') || null;
export function setToken(t) {
  authToken = t;
  if (t) localStorage.setItem('daisy_token', t);
  else localStorage.removeItem('daisy_token');
}
export function getToken() { return authToken; }

// Called on 401 so the app can reset auth state.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data; }
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const opts = { method, headers: { ...headers } };
  if (authToken) opts.headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) {
    if (isForm) opts.body = body; // FormData
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  let res;
  try {
    res = await fetch(BASE + path, opts);
  } catch {
    throw new ApiError('Network error. Please check your connection.', 0);
  }
  let text = await res.text();
  // Rewrite relative /uploads image paths to absolute backend URLs so images
  // stored on the API server render correctly from the Vercel-hosted frontend.
  if (API_ORIGIN && text.includes('"/uploads/')) {
    text = text.split('"/uploads/').join(`"${API_ORIGIN}/uploads/`);
  }
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(data.error || 'Something went wrong.', res.status, data);
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  upload: (files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    return request('/admin/upload', { method: 'POST', body: fd, isForm: true });
  },
};

// ---- endpoint helpers ----
export const AuthAPI = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/me', d),
};

export const StoreAPI = {
  settings: () => api.get('/settings'),
  hero: () => api.get('/hero'),
  homepage: () => api.get('/homepage'),
  categories: () => api.get('/categories'),
  category: (slug) => api.get(`/categories/${slug}`),
  products: (q = '') => api.get(`/products${q ? `?${q}` : ''}`),
  product: (slug) => api.get(`/products/${slug}`),
  filters: (cat) => api.get(`/products/filters${cat ? `?category=${cat}` : ''}`),
  fields: () => api.get('/product-fields'),
  governorates: () => api.get('/governorates'),
  policies: () => api.get('/policies'),
  policy: (key) => api.get(`/policies/${key}`),
};

export const CartAPI = {
  get: () => api.get('/cart'),
  add: (d) => api.post('/cart', d),
  update: (id, quantity) => api.put(`/cart/${id}`, { quantity }),
  remove: (id) => api.del(`/cart/${id}`),
  merge: (items) => api.post('/cart/merge', { items }),
};

export const WishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { productId }),
  remove: (productId) => api.del(`/wishlist/${productId}`),
};

export const OrderAPI = {
  place: (d) => api.post('/orders', d),
  mine: () => api.get('/orders'),
  get: (orderNumber) => api.get(`/orders/${orderNumber}`),
};

export const AdminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  products: (q = '') => api.get(`/admin/products${q ? `?${q}` : ''}`),
  product: (id) => api.get(`/admin/products/${id}`),
  createProduct: (d) => api.post('/admin/products', d),
  updateProduct: (id, d) => api.put(`/admin/products/${id}`, d),
  patchProduct: (id, d) => api.patch(`/admin/products/${id}`, d),
  duplicateProduct: (id) => api.post(`/admin/products/${id}/duplicate`),
  deleteProduct: (id) => api.del(`/admin/products/${id}`),
  categories: () => api.get('/admin/categories'),
  createCategory: (d) => api.post('/admin/categories', d),
  updateCategory: (id, d) => api.put(`/admin/categories/${id}`, d),
  deleteCategory: (id, force) => api.del(`/admin/categories/${id}${force ? '?force=true' : ''}`),
  fields: () => api.get('/admin/product-fields'),
  createField: (d) => api.post('/admin/product-fields', d),
  updateField: (id, d) => api.put(`/admin/product-fields/${id}`, d),
  deleteField: (id, force) => api.del(`/admin/product-fields/${id}${force ? '?force=true' : ''}`),
  orders: (q = '') => api.get(`/admin/orders${q ? `?${q}` : ''}`),
  order: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  customers: (q = '') => api.get(`/admin/customers${q ? `?${q}` : ''}`),
  hero: () => api.get('/admin/hero'),
  createHero: (d) => api.post('/admin/hero', d),
  updateHero: (id, d) => api.put(`/admin/hero/${id}`, d),
  deleteHero: (id) => api.del(`/admin/hero/${id}`),
  homepage: () => api.get('/admin/homepage'),
  createSection: (d) => api.post('/admin/homepage', d),
  updateSection: (id, d) => api.put(`/admin/homepage/${id}`, d),
  deleteSection: (id) => api.del(`/admin/homepage/${id}`),
  settings: () => api.get('/admin/settings'),
  updateSettings: (d) => api.put('/admin/settings', d),
  governorates: () => api.get('/admin/governorates'),
  updateGovernorates: (governorates) => api.put('/admin/governorates', { governorates }),
  updatePolicy: (key, d) => api.put(`/admin/policies/${key}`, d),
};
