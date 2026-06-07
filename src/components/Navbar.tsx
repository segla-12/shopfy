"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { LanguageSwitcher } from "@/ui/LanguageSwitcher";
import { ThemeToggle } from "@/ui/ThemeToggle";
import { BrandLogo } from "./BrandLogo";

export function Navbar() {
  const { language, t } = useLanguage();
  const storeLabel = language === "fr" ? "Boutiques" : "Stores";
  const dashboardLabel = language === "fr" ? "Dashboard" : "Dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur transition-colors dark:border-white/10 dark:bg-gray-950/95">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-3 py-3 sm:px-4 md:h-16 md:grid-cols-[auto_minmax(220px,1fr)_auto_auto] md:gap-4 md:py-0">
        <Link
          href="/"
          className="flex h-10 w-[122px] min-w-0 items-center transition hover:opacity-80 md:shrink-0"
          aria-label="Shopfy"
        >
          <BrandLogo priority sizes="122px" className="h-10 w-auto" />
        </Link>

        <div className="flex h-9 shrink-0 items-center justify-end gap-2 md:order-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="col-span-2 min-w-0 md:order-2 md:col-span-1">
          <input
            type="search"
            suppressHydrationWarning
            placeholder={t("nav.searchPlaceholder")}
            className="h-10 w-full max-w-full rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-400 dark:focus:bg-gray-900 md:h-11"
          />
        </div>

        <nav className="col-span-2 grid min-w-0 grid-cols-5 items-center gap-1 text-center text-xs font-black text-gray-600 dark:text-gray-300 sm:gap-2 md:order-3 md:col-span-1 md:flex md:h-10 md:items-center md:justify-end md:gap-1 md:text-sm">
          <Link className="flex h-9 min-w-0 items-center justify-center rounded-full px-1 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 md:h-10 md:px-3" href="/">{t("nav.home")}</Link>
          <Link className="flex h-9 min-w-0 items-center justify-center rounded-full px-1 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 md:h-10 md:px-3" href="/sell">{t("nav.sell")}</Link>
          <Link className="flex h-9 min-w-0 items-center justify-center rounded-full px-1 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 md:h-10 md:px-3" href="/favorites">{t("nav.favorites")}</Link>
          <Link className="flex h-9 min-w-0 items-center justify-center rounded-full px-1 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 md:h-10 md:px-3" href="/stores">{storeLabel}</Link>
          <Link className="flex h-9 min-w-0 items-center justify-center rounded-full px-1 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 md:h-10 md:px-3" href="/dashboard">{dashboardLabel}</Link>
        </nav>
      </div>
    </header>
  );
}
