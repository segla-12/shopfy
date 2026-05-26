"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language";
import type { WholesaleSupplier } from "@/types/marketplace";
import { SupplierCard } from "./SupplierCard";

type SupplierGridProps = {
  suppliers: WholesaleSupplier[];
};

export function SupplierGrid({ suppliers }: SupplierGridProps) {
  const { language } = useLanguage();
  const copy = getSupplierGridCopy(language);

  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
        <h3 className="text-lg font-black text-gray-950 dark:text-white">{copy.emptyTitle}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{copy.emptyText}</p>
        <Link href="/sell" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600">
          {copy.addSupplier}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {suppliers.map((supplier) => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
}

function getSupplierGridCopy(language: string) {
  if (language === "en") {
    return {
      emptyTitle: "No supplier found",
      emptyText: "Try another country, category, or supplier search.",
      addSupplier: "Add supplier profile",
    };
  }

  return {
    emptyTitle: "Aucun fournisseur trouvé",
    emptyText: "Essayez un autre pays, une autre catégorie ou une autre recherche.",
    addSupplier: "Ajouter un fournisseur",
  };
}
