import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WishlistAPI } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

const LS_KEY = 'daisy_guest_wishlist';
const readGuest = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const writeGuest = (ids) => localStorage.setItem(LS_KEY, JSON.stringify(ids));

export function WishlistProvider({ children }) {
  const { user, ready } = useAuth();
  const [ids, setIds] = useState([]);       // product ids in wishlist
  const [items, setItems] = useState([]);   // full products (loaded on demand / for user)

  const refreshUser = useCallback(async () => {
    const d = await WishlistAPI.get();
    setItems(d.items);
    setIds(d.productIds);
  }, []);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      if (user) {
        // merge guest wishlist
        const guest = readGuest();
        for (const pid of guest) { try { await WishlistAPI.add(pid); } catch { /* ignore */ } }
        writeGuest([]);
        try { await refreshUser(); } catch { /* ignore */ }
      } else {
        setIds(readGuest());
        setItems([]);
      }
    })();
  }, [user, ready, refreshUser]);

  const has = useCallback((productId) => ids.includes(productId), [ids]);

  const toggle = useCallback(async (product) => {
    const productId = product.id;
    const inList = ids.includes(productId);
    if (user) {
      if (inList) { await WishlistAPI.remove(productId); } else { await WishlistAPI.add(productId); }
      await refreshUser();
    } else {
      const next = inList ? ids.filter((x) => x !== productId) : [...ids, productId];
      setIds(next);
      writeGuest(next);
    }
    return !inList;
  }, [ids, user, refreshUser]);

  return (
    <WishlistContext.Provider value={{ ids, items, has, toggle, refresh: refreshUser, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}
