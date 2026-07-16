"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLanguage } from "@/lib/language";
import { LanguageSwitcher } from "@/ui/LanguageSwitcher";
import { ThemeToggle } from "@/ui/ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { useNavbarMode } from "@/lib/navbarMode";


export function Navbar() {
  const { t } = useLanguage();
  const { mode, setMode } = useNavbarMode();
  const [searchQuery, setSearchQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    const url = query ? `/#products?q=${encodeURIComponent(query)}` : "/#products";
    window.location.assign(url);
  }

  const grosItems = [
    { href: "/", label: t("nav.home") },
    { href: "/sell", label: t("nav.sell") },
    { href: "/favorites", label: t("nav.favorites") },
  ];

  const detailItems = [
    { href: "/stores", label: t("nav.stores") },
    { href: "/dashboard", label: t("nav.dashboard") },
  ];

  const navItems = mode === "gros" ? grosItems : detailItems;

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

        <form onSubmit={submitSearch} className="col-span-2 min-w-0 md:order-2 md:col-span-1">
          <input
            type="search"
            suppressHydrationWarning
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            className="h-10 w-full max-w-full rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-400 dark:focus:bg-gray-900 md:h-11"
          />
        </form>

        <nav className="col-span-2 flex min-w-0 flex-wrap items-center justify-center gap-2 text-center text-xs font-black text-gray-600 dark:text-gray-300 sm:gap-2 md:order-3 md:col-span-1 md:justify-end md:text-sm">
          <div className="flex h-9 items-center rounded-full border border-gray-200 bg-gray-100 text-[11px] uppercase text-gray-600 dark:border-white/10 dark:bg-white/10 dark:text-gray-300 md:h-10 md:text-xs">
            <button
              type="button"
              onClick={() => setMode("gros")}
              className={`flex h-full items-center rounded-full px-3 transition ${mode === "gros" ? "bg-orange-500 text-white" : "hover:bg-orange-50 hover:text-orange-500"}`}
            >
              {t("nav.modeGros")}
            </button>
            <span className="px-2 text-gray-400 dark:text-gray-500">|</span>
            <button
              type="button"
              onClick={() => setMode("detail")}
              className={`flex h-full items-center rounded-full px-3 transition ${mode === "detail" ? "bg-orange-500 text-white" : "hover:bg-orange-50 hover:text-orange-500"}`}
            >
              {t("nav.modeDetail")}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-9 min-w-0 items-center justify-center rounded-full px-1 transition hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 md:h-10 md:px-3"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
