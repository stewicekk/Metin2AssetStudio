import { useState, useEffect } from 'react';
import type { Locale, Dict } from './types';
import { en } from './en';
import { cs } from './cs';

const dicts: Record<Locale, Dict> = { en, cs };

function getInitialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('metin2_locale') as Locale | null;
    if (stored === 'en' || stored === 'cs') return stored;
  }
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language?.split('-')[0];
    if (lang === 'cs') return 'cs';
  }
  return 'en';
}

let currentLocale: Locale = getInitialLocale();

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(l => l());
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem('metin2_locale', locale);
  notifyListeners();
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: keyof Dict): string {
  return dicts[currentLocale][key] || key;
}

export function useT(): { t: typeof t; locale: Locale; setLocale: typeof setLocale } {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(n => n + 1);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return { t, locale: currentLocale, setLocale };
}
