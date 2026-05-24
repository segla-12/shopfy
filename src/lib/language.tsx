"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  formatTranslation,
  Language,
  languages,
  TranslationKey,
  translateCategory,
  translateCountry,
} from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "shopfy-language";

type LanguageContextValue = {
  language: Language;
  isPending: boolean;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  categoryLabel: (category: string) => string;
  countryLabel: (countryCode: string | undefined) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (isLanguage(savedLanguage)) {
        setLanguageState(savedLanguage);
      }

      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [isReady, language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    startTransition(() => {
      setLanguageState(nextLanguage);
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => (
      formatTranslation(language, key, values)
    ),
    [language],
  );

  const categoryLabel = useCallback(
    (category: string) => translateCategory(category, language),
    [language],
  );

  const countryLabel = useCallback(
    (countryCode: string | undefined) => translateCountry(countryCode, language),
    [language],
  );

  const contextValue = useMemo(
    () => ({
      language,
      isPending,
      setLanguage,
      t,
      categoryLabel,
      countryLabel,
    }),
    [categoryLabel, countryLabel, isPending, language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

function isLanguage(value: string | null): value is Language {
  return languages.includes(value as Language);
}
