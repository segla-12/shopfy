"use client";

import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";
import { useFavorites } from "@/lib/favorites";
import { useLanguage } from "@/lib/language";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/marketplace";
import { ButtonLink } from "@/ui/ButtonLink";

export default function FavoritesPage() {
  const { favoriteIdSet } = useFavorites();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      const loadedProducts = await getProducts();

      if (isMounted) {
        setProducts(loadedProducts);
        setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteIdSet.has(product.id)),
    [favoriteIdSet, products],
  );

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-500">{t("favorites.kicker")}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 dark:text-white">{t("favorites.title")}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-gray-600 dark:text-gray-300">
              {isLoading ? t("marketplace.loading") : t("favorites.count", { count: favoriteProducts.length })}
            </p>
          </div>
          <ButtonLink href="/#products" variant="secondary">{t("favorites.browse")}</ButtonLink>
        </div>

        {favoriteProducts.length > 0 ? (
          <ProductGrid products={favoriteProducts} />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
            <h2 className="text-lg font-black text-gray-950 dark:text-white">{t("favorites.emptyTitle")}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{t("favorites.emptyText")}</p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
