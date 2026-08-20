import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { translations } from '../i18n/translations.js';
import { StoreAPI } from '../services/api.js';

const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

export function UIProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('daisy_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('daisy_theme') || 'light');
  const [settings, setSettings] = useState(null);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('daisy_lang', lang);
  }, [lang, dir]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('daisy_theme', theme);
  }, [theme]);

  useEffect(() => {
    StoreAPI.settings().then((d) => setSettings(d.settings)).catch(() => {});
  }, []);

  const t = useCallback((key, vars) => {
    let s = translations[lang]?.[key] ?? translations.en[key] ?? key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  }, [lang]);

  // pick localized field from a bilingual object: L(obj, 'name') -> nameAr/nameEn
  const L = useCallback((obj, base) => {
    if (!obj) return '';
    const suffix = lang === 'ar' ? 'Ar' : 'En';
    return obj[base + suffix] ?? obj[base + 'En'] ?? '';
  }, [lang]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const toggleLang = () => setLang((l) => (l === 'en' ? 'ar' : 'en'));

  const toast = useCallback((message, type = 'success') => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts, { id, message, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200);
  }, []);
  const dismissToast = (id) => setToasts((ts) => ts.filter((x) => x.id !== id));

  const money = useCallback((amount) => {
    const cur = settings?.currency || 'EGP';
    const n = Number(amount || 0).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 });
    return lang === 'ar' ? `${n} ${cur === 'EGP' ? 'ج.م' : cur}` : `${cur} ${n}`;
  }, [settings, lang]);

  return (
    <UIContext.Provider value={{
      lang, setLang, toggleLang, theme, toggleTheme, dir, t, L, settings, setSettings,
      toast, toasts, dismissToast, money,
    }}>
      {children}
    </UIContext.Provider>
  );
}
