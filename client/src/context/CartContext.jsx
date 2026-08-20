import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartAPI } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const LS_KEY = 'daisy_guest_cart';
const readGuest = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const writeGuest = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));

// Recompute totals for a set of line items.
function totals(items) {
  const subtotal = items.reduce((s, l) => s + (l.outOfStock ? 0 : l.unitPrice * l.quantity), 0);
  const count = items.reduce((s, l) => s + l.quantity, 0);
  return { subtotal: +subtotal.toFixed(2), count };
}

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshUserCart = useCallback(async () => {
    const d = await CartAPI.get();
    setItems(d.items);
  }, []);

  const loadGuest = useCallback(() => {
    const g = readGuest();
    setItems(g.map((x) => ({ ...x, lineTotal: +(x.unitPrice * x.quantity).toFixed(2) })));
  }, []);

  // On auth ready / user change: merge guest cart then load from server, else load guest.
  useEffect(() => {
    if (!ready) return;
    (async () => {
      if (user) {
        const guest = readGuest();
        if (guest.length) {
          try { await CartAPI.merge(guest.map((g) => ({ productId: g.productId, variantId: g.variantId, quantity: g.quantity }))); } catch { /* ignore */ }
          writeGuest([]);
        }
        try { await refreshUserCart(); } catch { /* ignore */ }
      } else {
        loadGuest();
      }
    })();
  }, [user, ready, refreshUserCart, loadGuest]);

  const addItem = useCallback(async (product, variant, quantity = 1) => {
    if (user) {
      const d = await CartAPI.add({ productId: product.id, variantId: variant?.id || null, quantity });
      setItems(d.items);
    } else {
      const available = variant ? variant.stock : product.stock;
      const guest = readGuest();
      const key = (x) => x.productId === product.id && (x.variantId || null) === (variant?.id || null);
      const existing = guest.find(key);
      const image = product.mainImage || product.images?.[0]?.url || null;
      const unitPrice = variant?.price ?? product.effectivePrice;
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, available);
      } else {
        guest.push({
          productId: product.id, variantId: variant?.id || null, quantity: Math.min(quantity, available),
          slug: product.slug, nameEn: product.nameEn, nameAr: product.nameAr, image,
          unitPrice, variantLabel: variant?.label || '',
          attributes: variant?.optionLabels || [],
          available, outOfStock: available <= 0,
        });
      }
      writeGuest(guest);
      loadGuest();
    }
  }, [user, loadGuest]);

  const updateItem = useCallback(async (id, quantity) => {
    if (user) {
      const d = await CartAPI.update(id, quantity);
      setItems(d.items);
    } else {
      const guest = readGuest();
      const it = guest.find((x) => (x.id || x.productId + (x.variantId || '')) === id);
      if (it) it.quantity = Math.max(1, Math.min(quantity, it.available));
      writeGuest(guest);
      loadGuest();
    }
  }, [user, loadGuest]);

  const removeItem = useCallback(async (id) => {
    if (user) {
      const d = await CartAPI.remove(id);
      setItems(d.items);
    } else {
      const guest = readGuest().filter((x) => (x.id || x.productId + (x.variantId || '')) !== id);
      writeGuest(guest);
      loadGuest();
    }
  }, [user, loadGuest]);

  const clear = useCallback(() => {
    if (!user) { writeGuest([]); setItems([]); }
    else refreshUserCart().catch(() => {});
  }, [user, refreshUserCart]);

  // Give guest items a stable synthetic id for keys/updates.
  const normalized = items.map((x) => ({ ...x, id: x.id || x.productId + (x.variantId || '') }));
  const { subtotal, count } = totals(normalized);

  return (
    <CartContext.Provider value={{ items: normalized, subtotal, count, loading, setLoading, addItem, updateItem, removeItem, clear, refresh: refreshUserCart }}>
      {children}
    </CartContext.Provider>
  );
}
