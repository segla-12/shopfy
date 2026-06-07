import { Language, languages } from "@/lib/i18n";

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_COOKIE_KEY = "shopfy-language";

export function isLanguage(value: string | null | undefined): value is Language {
  return languages.includes(value as Language);
}
