import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ar } from './ar';
import { en } from './en';

export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

// Use a loose type so ar and en are both assignable
type Translations = Record<string, unknown>;

interface LanguageContextType {
  lang: Language;
  dir: Direction;
  t: typeof ar;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const translations: Record<Language, Translations> = { ar, en };

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem('sadeem_lang');
    if (stored === 'ar' || stored === 'en') return stored;
  } catch { /* empty */ }
  // Auto-detect from browser
  try {
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('en')) return 'en';
  } catch { /* empty */ }
  return 'ar'; // Default fallback
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';
  const t = translations[lang as Language];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('sadeem_lang', lang);
  }, [lang, dir]);

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLangState((prev: Language) => prev === 'ar' ? 'en' : 'ar');
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, dir, t, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
