import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LanguageCode, TranslationSchema, translations, languages, Language } from '../translations';

const LANGUAGE_KEY = 'expense_manager_language';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
  tCategory: (name: string) => string;
  currentLanguage: Language;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: Record<string, any>, path: string): string {
  const result = path.split('.').reduce((acc, key) => acc?.[key], obj);
  return typeof result === 'string' ? result : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY) as LanguageCode | null;
    return stored && translations[stored] ? stored : 'en';
  });

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem(LANGUAGE_KEY, code);
  }, []);

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = useCallback(
    (key: string): string => getNestedValue(translations[language] as unknown as Record<string, any>, key),
    [language],
  );

  const tCategory = useCallback(
    (name: string): string => {
      const cats = translations[language].categories as Record<string, string>;
      return cats[name] ?? name;
    },
    [language],
  );

  const currentLanguage = languages.find((l) => l.code === language) ?? languages[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tCategory, currentLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
