"use client";

import { useEffect, useMemo, useState } from "react";
import { SupplierGrid } from "@/components/SupplierGrid";
import { categories } from "@/data/categories";
import { useLanguage } from "@/lib/language";
import { buildWholesaleSuppliers, filterWholesaleSuppliers } from "@/lib/supplierDirectory";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/marketplace";

export function MarketplaceSection() {
  const { language, t, categoryLabel, countryLabel } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const copy = getMarketplaceDirectoryCopy(language);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams(window.location.search);
    const requestedQuery = params.get("q")?.trim() || "";

    if (requestedQuery) {
      setQuery(requestedQuery);
    }

    async function loadProducts() {
      const products = await getProducts();

      if (isMounted) {
        setCatalogProducts(products);
        setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const suppliers = useMemo(() => buildWholesaleSuppliers(catalogProducts), [catalogProducts]);
  const filteredSuppliers = useMemo(() => (
    filterWholesaleSuppliers(suppliers, { query, category, country, city })
  ), [category, city, country, query, suppliers]);

  const countryOptions = useMemo(() => (
    Array.from(new Set(suppliers.map((supplier) => supplier.country).filter(Boolean) as string[])).sort()
  ), [suppliers]);

  const cityOptions = useMemo(() => (
    Array.from(new Set(
      suppliers
        .filter((supplier) => !country || supplier.country === country)
        .map((supplier) => supplier.city || supplier.location)
        .filter(Boolean) as string[],
    )).sort((firstCity, secondCity) => firstCity.localeCompare(secondCity))
  ), [country, suppliers]);

  const supplierCountText = filteredSuppliers.length === 1
    ? copy.oneSupplier
    : copy.manySuppliers(filteredSuppliers.length);

  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.title}</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-300">
            {isLoading ? t("marketplace.loading") : supplierCountText}
          </p>
        </div>

        <div id="categories" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            suppressHydrationWarning
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
          />
          <select
            suppressHydrationWarning
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
          >
            {categories.map((item) => (
              <option key={item} value={item}>{categoryLabel(item)}</option>
            ))}
          </select>
          <select
            suppressHydrationWarning
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setCity("");
            }}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
          >
            <option value="">{t("marketplace.allCountries")}</option>
            {countryOptions.map((item) => (
              <option key={item} value={item}>{countryLabel(item)}</option>
            ))}
          </select>
          <select
            suppressHydrationWarning
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
          >
            <option value="">{t("marketplace.allCities")}</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <SupplierGrid suppliers={filteredSuppliers} />
    </section>
  );
}

function getMarketplaceDirectoryCopy(language: string) {
  if (language === "en") {
    return {
      kicker: "Supplier directory",
      title: "Wholesale suppliers",
      searchPlaceholder: "Search supplier, product, delivery...",
      oneSupplier: "1 supplier listed",
      manySuppliers: (count: number) => `${count} suppliers listed`,
    };
  }

  return {
    kicker: "Répertoire grossiste",
    title: "Fournisseurs grossistes",
    searchPlaceholder: "Rechercher fournisseur, produit, livraison...",
    oneSupplier: "1 fournisseur référencé",
    manySuppliers: (count: number) => `${count} fournisseurs référencés`,
  };
}
