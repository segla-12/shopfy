"use client";

import { useLanguage } from "@/lib/language";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("theme.toggleLabel")}
      aria-pressed={isDark}
      className="relative inline-flex h-9 w-[76px] shrink-0 items-center rounded-full border border-gray-200 bg-gray-50 p-1 shadow-sm transition dark:border-white/10 dark:bg-white/10"
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 h-7 w-7 rounded-full bg-gray-950 shadow-sm transition-transform duration-300 dark:bg-white ${
          isDark ? "translate-x-[40px]" : "translate-x-0"
        }`}
      />
      <span className={`relative z-10 grid h-7 w-7 place-items-center text-xs transition ${isDark ? "text-gray-400" : "text-white"}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M12 5V3m0 18v-2M5 12H3m18 0h-2M6.64 6.64 5.22 5.22m13.56 13.56-1.42-1.42m0-10.72 1.42-1.42M5.22 18.78l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      <span className={`relative z-10 ml-auto grid h-7 w-7 place-items-center text-xs transition ${isDark ? "text-gray-950" : "text-gray-400"}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M20.25 15.4A7.7 7.7 0 0 1 8.6 3.75 8.8 8.8 0 1 0 20.25 15.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
