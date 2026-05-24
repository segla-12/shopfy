"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { categories } from "@/data/categories";
import { useLanguage } from "@/lib/language";
import { sortProductsByMarketplacePriority } from "@/lib/productSort";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/marketplace";

export function MarketplaceSection() {
  const { t, categoryLabel, countryLabel } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const priceLimit = Number(maxPrice);

    const matchingProducts = catalogProducts.filter((product) => {
      const matchesQuery = !normalizedQuery || product.title.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "Tous" || product.category === category;
      const matchesCountry = !country || product.country === country;
      const matchesCity = !city || (product.city || product.location || "") === city;
      const matchesPrice = !priceLimit || product.price <= priceLimit;

      return matchesQuery && matchesCategory && matchesCountry && matchesCity && matchesPrice;
    });

    return sortProductsByMarketplacePriority(matchingProducts);
  }, [catalogProducts, category, city, country, maxPrice, query]);

  const countryOptions = useMemo(() => (
    Array.from(new Set(catalogProducts.map((product) => product.country).filter(Boolean) as string[])).sort()
  ), [catalogProducts]);

  const cityOptions = useMemo(() => (
    Array.from(new Set(
      catalogProducts
        .filter((product) => !country || product.country === country)
        .map((product) => product.city || product.location)
        .filter(Boolean) as string[],
    )).sort((firstCity, secondCity) => firstCity.localeCompare(secondCity))
  ), [catalogProducts, country]);

  const productCountText = filteredProducts.length === 1
    ? t("marketplace.oneProduct")
    : t("marketplace.manyProducts", { count: filteredProducts.length });

  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{t("marketplace.kicker")}</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{t("marketplace.title")}</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-300">
            {isLoading ? t("marketplace.loading") : productCountText}
          </p>
        </div>

        <div id="categories" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("marketplace.searchPlaceholder")}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
          />
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            type="number"
            min="0"
            placeholder={t("marketplace.maxPricePlaceholder")}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
          >
            {categories.map((item) => (
              <option key={item} value={item}>{categoryLabel(item)}</option>
            ))}
          </select>
          <select
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

      <ProductGrid products={filteredProducts} />
    </section>
  );
}
