"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import type { ShopfyStore } from "@/types/storefront";
import { CertifiedBadge } from "@/ui/CertifiedBadge";

type StoreCardProps = {
  store: ShopfyStore;
};

export function StoreCard({ store }: StoreCardProps) {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copy = getStoreCardCopy(language);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyLink() {
    if (!navigator.clipboard) {
      return;
    }

    const url = `${window.location.origin}/store/${store.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="grid overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md dark:border-white/10 dark:bg-gray-900 md:grid-cols-[220px_minmax(0,1fr)]">
      <Link href={`/store/${store.slug}`} className="relative min-h-56 overflow-hidden bg-gray-100 dark:bg-gray-950">
        <Image
          src={store.bannerUrl}
          alt={store.name}
          fill
          sizes="(min-width: 768px) 220px, 100vw"
          className="object-cover"
        />
      </Link>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-gray-950">
            <Image src={store.logoUrl} alt={`${store.name} logo`} fill sizes="56px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-orange-500">{copy.badge}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="break-words text-xl font-black text-gray-950 dark:text-white">{store.name}</h2>
              {store.isCertified ? (
                <CertifiedBadge label={copy.certifiedBadge} className="min-h-6 rounded-md px-2 text-[10px]" />
              ) : null}
            </div>
            <p className="mt-1 break-words text-sm leading-6 text-gray-600 dark:text-gray-300">{store.tagline}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:max-w-48">
          <Metric label={copy.products} value={String(store.products.length)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/store/${store.slug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.openStore}
          </Link>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus:ring-orange-400/20"
          >
            {copied ? t("share.linkCopied") : t("share.copyStoreLink")}
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <p className="truncate text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function getStoreCardCopy(language: string) {
  if (language === "fr") {
    return {
      badge: "Boutique vendeur",
      certifiedBadge: "Boutique certifiée",
      products: "Produits",
      openStore: "Ouvrir la boutique",
    };
  }

  return {
    badge: "Seller store",
    certifiedBadge: "Certified store",
    products: "Products",
    openStore: "Open store",
  };
}
