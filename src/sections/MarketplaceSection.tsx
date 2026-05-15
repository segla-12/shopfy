"use client";

import { useEffect, useMemo, useState } from "react";
import { categories } from "@/data/categories";
import { ProductGrid } from "@/components/ProductGrid";
import { sortProductsByMarketplacePriority } from "@/lib/productSort";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/marketplace";

export function MarketplaceSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
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
        const matchesPrice = !priceLimit || product.price <= priceLimit;

        return matchesQuery && matchesCategory && matchesPrice;
      });

    return sortProductsByMarketplacePriority(matchingProducts);
  }, [catalogProducts, category, maxPrice, query]);

  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">Catalogue</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950">Produits recents</h2>
          <p className="mt-2 text-gray-500">
            {isLoading ? "Chargement des produits..." : `${filteredProducts.length} produit(s) affiche(s)`}
          </p>
        </div>

        <div id="categories" className="grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher..."
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            type="number"
            min="0"
            placeholder="Prix max"
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <ProductGrid products={filteredProducts} />
    </section>
  );
}
