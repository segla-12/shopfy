"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createImportedStoreProduct, formatStoreMoney } from "@/lib/demoStores";
import { useLanguage } from "@/lib/language";
import { getMySupabaseStores, importSupabaseStoreProduct } from "@/services/storeService";
import type { SupplierSourceProduct } from "@/types/storefront";

type SourcingHubProps = {
  products: SupplierSourceProduct[];
};

export function SourcingHub({ products }: SourcingHubProps) {
  const { language } = useLanguage();
  const copy = getSourcingCopy(language);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [activeStoreSlug, setActiveStoreSlug] = useState("");
  const [hasSellerStore, setHasSellerStore] = useState(false);
  const [sellerStoreMessage, setSellerStoreMessage] = useState("");
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const filteredProducts = useMemo(() => (
    products.filter((product) => {
      const matchesQuery = !query.trim()
        || `${product.title} ${product.description} ${product.supplierName}`.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || product.category === category;
      return matchesQuery && matchesCategory;
    })
  ), [category, products, query]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      getMySupabaseStores()
        .then((stores) => {
          setHasSellerStore(stores.length > 0);
          setActiveStoreSlug(stores[0]?.slug || "");
          setSellerStoreMessage(stores.length > 0 ? "" : getSourcingCopy(language).createStoreFirst);
        })
        .catch((error) => {
          setHasSellerStore(false);
          setActiveStoreSlug("");
          setSellerStoreMessage(error instanceof Error ? error.message : getSourcingCopy(language).authRequired);
        });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [language]);

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-5xl dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">{copy.description}</p>
        </div>

        {activeStoreSlug ? (
          <Link
            href={`/store/${activeStoreSlug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-gray-950 px-5 text-sm font-black text-white transition hover:bg-orange-500 dark:bg-white dark:text-gray-950 dark:hover:bg-orange-300"
          >
            {copy.viewStore}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="min-h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
        >
          <option value="">{copy.allCategories}</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {sellerStoreMessage ? (
        <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-orange-800 dark:text-orange-100">{sellerStoreMessage}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/auth?next=/sourcing"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-orange-200 bg-white px-4 text-sm font-black text-orange-700 transition hover:border-orange-300 dark:border-orange-400/20 dark:bg-gray-900 dark:text-orange-200"
            >
              {copy.authLink}
            </Link>
            <Link
              href="/create-store"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600"
            >
              {copy.createStore}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredProducts.map((product) => (
          <SourcingProductCard
            key={product.id}
            product={product}
            copy={copy}
            activeStoreSlug={activeStoreSlug}
            canImport={hasSellerStore && Boolean(activeStoreSlug)}
          />
        ))}
      </div>
    </section>
  );
}

function SourcingProductCard({
  product,
  copy,
  activeStoreSlug,
  canImport,
}: {
  product: SupplierSourceProduct;
  copy: ReturnType<typeof getSourcingCopy>;
  activeStoreSlug: string;
  canImport: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "imported">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function importProduct() {
    setErrorMessage("");

    if (!canImport || !activeStoreSlug) {
      setErrorMessage(copy.createStoreFirst);
      return;
    }

    try {
      await importSupabaseStoreProduct(activeStoreSlug, createImportedStoreProduct(product));
      setStatus("imported");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.importError);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-950">
        <Image src={product.image} alt={product.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>

      <div className="grid gap-4 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-black uppercase text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300">
              {product.category}
            </span>
            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              {product.supplierName}
            </span>
          </div>
          <h2 className="mt-3 break-words text-xl font-black text-gray-950 dark:text-white">{product.title}</h2>
          <p className="mt-2 break-words text-sm leading-6 text-gray-600 dark:text-gray-300">{product.description}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <MiniMetric label={copy.wholesale} value={formatStoreMoney(product.wholesalePrice, product.currency)} />
          <MiniMetric label={copy.retail} value={formatStoreMoney(product.recommendedRetailPrice, product.currency)} />
          <MiniMetric label={copy.moq} value={String(product.minimumOrderQuantity)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={importProduct}
            disabled={!canImport || !activeStoreSlug}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "imported" ? copy.imported : copy.import}
          </button>
          {canImport && activeStoreSlug ? (
            <Link
              href={`/store/${activeStoreSlug}`}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
            >
              {copy.openStore}
            </Link>
          ) : null}
        </div>
        {errorMessage ? (
          <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <p className="truncate text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function getSourcingCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Sourcing",
      title: "Produits fournisseurs",
      description: "Importez un produit fournisseur dans votre boutique vendeur et ajustez ensuite le prix de vente.",
      authRequired: "Connectez-vous avec votre compte vendeur pour importer des produits.",
      createStoreFirst: "Creez d'abord votre boutique vendeur avant d'importer des produits.",
      authLink: "Compte vendeur",
      createStore: "Créer boutique",
      viewStore: "Voir ma boutique",
      searchPlaceholder: "Rechercher produit ou fournisseur...",
      allCategories: "Toutes categories",
      wholesale: "Prix gros",
      retail: "Prix vente",
      moq: "MOQ",
      import: "Ajouter a ma boutique",
      imported: "Produit ajoute",
      importError: "Impossible d'importer le produit dans Supabase.",
      openStore: "Ouvrir la boutique",
    };
  }

  return {
    kicker: "Sourcing",
    title: "Supplier products",
    description: "Import supplier products into your seller store and adjust the retail price later.",
    authRequired: "Sign in with your seller account to import products.",
    createStoreFirst: "Create your seller store before importing products.",
    authLink: "Seller account",
    createStore: "Create store",
    viewStore: "View my store",
    searchPlaceholder: "Search product or supplier...",
    allCategories: "All categories",
    wholesale: "Wholesale",
    retail: "Retail",
    moq: "MOQ",
    import: "Add to my store",
    imported: "Product added",
    importError: "Unable to import the product into Supabase.",
    openStore: "Open store",
  };
}
