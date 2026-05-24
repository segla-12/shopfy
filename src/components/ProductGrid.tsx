"use client";

import { useLanguage } from "@/lib/language";
import type { Product } from "@/types/marketplace";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const { t } = useLanguage();

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h3 className="text-lg font-black text-gray-950">{t("marketplace.emptyTitle")}</h3>
        <p className="mt-2 text-sm text-gray-500">{t("marketplace.emptyText")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
