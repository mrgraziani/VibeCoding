import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const dictionaries = { en, fr, es };

export const I18nContext = createContext(null);

export function detectUserLocale() {
  // 1. Check user preference stored in localStorage
  try {
    const saved = localStorage.getItem('app_locale');
    if (saved && (saved === 'en' || saved === 'fr' || saved === 'es')) {
      return saved;
    }
  } catch (_) {
    // localStorage may be unavailable in some private browsing or test environments
  }

  // 2. Check browser navigator language
  try {
    const navLangs = navigator.languages || [navigator.language || ''];
    for (const lang of navLangs) {
      if (lang) {
        const lower = lang.toLowerCase();
        if (lower.startsWith('es')) return 'es';
        if (lower.startsWith('fr')) return 'fr';
      }
    }
  } catch (_) {
    // fallback if navigator is undefined
  }

  // 3. Default to English
  return 'en';
}

export function I18nProvider({ children, initialLocale }) {
  const [locale, setLocaleState] = useState(() => initialLocale || detectUserLocale());

  const setLocale = useCallback((newLocale) => {
    if (newLocale !== 'en' && newLocale !== 'fr' && newLocale !== 'es') return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem('app_locale', newLocale);
    } catch (_) {}
  }, []);

  const t = useCallback((key, params = {}) => {
    const dict = dictionaries[locale] || dictionaries.en;
    const fallbackDict = dictionaries.en;

    const resolve = (obj, path) => {
      return path.split('.').reduce((curr, part) => (curr && curr[part] != null ? curr[part] : null), obj);
    };

    let text = resolve(dict, key);
    if (text == null) {
      text = resolve(fallbackDict, key);
    }
    if (text == null) {
      return key;
    }

    if (typeof text === 'string') {
      return Object.entries(params).reduce((str, [k, val]) => {
        return str.replace(new RegExp(`\\{${k}\\}`, 'g'), val);
      }, text);
    }

    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales: ['en', 'fr', 'es'] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key, params = {}) => {
        const resolve = (obj, path) => path.split('.').reduce((c, p) => (c && c[p] != null ? c[p] : null), obj);
        let text = resolve(en, key) || key;
        if (typeof text === 'string') {
          return Object.entries(params).reduce((str, [k, val]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), val), text);
        }
        return text;
      },
      availableLocales: ['en', 'fr', 'es'],
    };
  }
  return context;
}
