"use client";

import { Language, languages } from "@/lib/i18n";
import { useLanguage } from "@/lib/language";

export function LanguageSwitcher() {
  const { language, isPending, setLanguage, t } = useLanguage();

  return (
    <div
      aria-label={t("language.switcherLabel")}
      className="relative grid h-9 w-[76px] shrink-0 grid-cols-2 overflow-hidden rounded-full border border-gray-200 bg-gray-50 p-1 shadow-sm transition dark:border-white/10 dark:bg-white/10"
      role="group"
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 h-7 w-[32px] rounded-full bg-gray-950 shadow-sm transition-transform duration-300 ease-out dark:bg-white ${
          language === "en" ? "translate-x-[34px]" : "translate-x-0"
        }`}
      />

      {languages.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={language === item}
          aria-label={getLanguageName(item, t)}
          disabled={isPending}
          onClick={() => setLanguage(item)}
          className={`relative z-10 inline-flex h-7 items-center justify-center rounded-full text-[11px] font-black transition-colors duration-300 ${
            language === item ? "text-white dark:text-gray-950" : "text-gray-500 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function getLanguageName(language: Language, t: ReturnType<typeof useLanguage>["t"]) {
  return language === "fr" ? t("language.french") : t("language.english");
}
