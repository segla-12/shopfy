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
  TranslationKey,
  translateCategory,
  translateCountry,
} from "@/lib/i18n";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_KEY } from "@/lib/languageConfig";

type LanguageContextValue = {
  language: Language;
  isPending: boolean;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  categoryLabel: (category: string) => string;
  countryLabel: (countryCode: string | undefined) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
  initialLanguage?: Language;
};

export function LanguageProvider({ children, initialLanguage = DEFAULT_LANGUAGE }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem(LANGUAGE_COOKIE_KEY, language);
  }, [language]);

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

