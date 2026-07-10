import { createContext, useContext, useState, useCallback } from 'react';
import en from '../lang/en';
import np from '../lang/np';

const languages = { en, np };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('nagarik_lang') || 'np'; }
    catch { return 'np'; }
  });

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = languages[lang];
    for (const k of keys) {
      if (value && typeof value === 'object') value = value[k];
      else return key;
    }
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, p) => params[p] ?? `{${p}}`);
    }
    return key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'np' : 'en';
      try { localStorage.setItem('nagarik_lang', next); } catch {}
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
