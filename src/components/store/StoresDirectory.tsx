"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { getSupabaseStores } from "@/services/storeService";
import type { ShopfyStore } from "@/types/storefront";
import { StoreCard } from "./StoreCard";

type StoresDirectoryProps = {
  stores: ShopfyStore[];
};

export function StoresDirectory({ stores }: StoresDirectoryProps) {
  const { language } = useLanguage();
  const copy = getStoresDirectoryCopy(language);
  const [supabaseStores, setSupabaseStores] = useState<ShopfyStore[]>([]);
  const allStores = useMemo(() => {
    const supabaseSlugs = new Set(supabaseStores.map((store) => store.slug));
    return [...supabaseStores, ...stores.filter((store) => !supabaseSlugs.has(store.slug))];
  }, [stores, supabaseStores]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      getSupabaseStores().then(setSupabaseStores).catch(() => setSupabaseStores([]));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

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

        <div className="flex flex-wrap gap-2">
          <Link
            href="/create-store"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.createStore}
          </Link>
          <Link
            href="/sourcing"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-gray-950 px-5 text-sm font-black text-white transition hover:bg-orange-500 dark:bg-white dark:text-gray-950 dark:hover:bg-orange-300"
          >
            {copy.sourcing}
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-gray-950 dark:text-white">{copy.createTitle}</p>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.createText}</p>
          </div>
          <Link
            href="/create-store"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.createStore}
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {allStores.map((store) => (
          <StoreCard key={store.slug} store={store} />
        ))}
      </div>
    </section>
  );
}

function getStoresDirectoryCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Boutiques",
      title: "Boutiques vendeurs Shopfy",
      description: "Chaque vendeur dispose d'un lien public, d'un catalogue, d'un panier et d'une identite de marque.",
      createTitle: "Créez votre boutique en quelques etapes",
      createText: "Choisissez un nom, ajoutez votre identite, validez le lien public, puis commencez a importer des produits.",
      createStore: "Créer boutique",
      sourcing: "Voir les produits fournisseurs",
    };
  }

  return {
    kicker: "Stores",
    title: "Shopfy seller stores",
    description: "Each seller gets a public store link, a catalog, a cart, and a brand identity.",
    createTitle: "Create your store in a few steps",
    createText: "Choose a name, add your brand identity, validate the public link, then start importing products.",
    createStore: "Create store",
    sourcing: "Browse supplier products",
  };
}
