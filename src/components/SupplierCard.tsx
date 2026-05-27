"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { getSupplierProfileHref } from "@/lib/seller";
import type { WholesaleSupplier } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { SellerAvatar } from "@/ui/SellerAvatar";

type SupplierCardProps = {
  supplier: WholesaleSupplier;
};

export function SupplierCard({ supplier }: SupplierCardProps) {
  const { language } = useLanguage();
  const copy = getSupplierCardCopy(language);
  const profileHref = getSupplierProfileHref(supplier.phone);
  const featuredProduct = supplier.products[0];
  const supplierImage = supplier.photo || supplier.firstProductImage;
  const description = featuredProduct?.description || copy.descriptionFallback;
  const moq = formatMoq(featuredProduct?.minimumOrderQuantity, copy);
  const price = featuredProduct ? `${formatPrice(featuredProduct.price)} FCFA` : copy.priceFallback;

  return (
    <article className="grid grid-cols-[132px_minmax(0,1fr)] items-start overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md dark:border-white/10 dark:bg-gray-900 sm:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
      <Link href={profileHref} className="relative h-[clamp(204px,58vw,232px)] overflow-hidden border-r border-gray-100 bg-gray-50 sm:h-[clamp(196px,24vw,224px)] dark:border-white/10 dark:bg-gray-950">
        {supplierImage ? (
          <Image
            src={supplierImage}
            alt={supplier.name}
            fill
            unoptimized={supplierImage.startsWith("data:")}
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 190px, 132px"
            className="object-contain object-center p-3"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3">
            <SellerAvatar name={supplier.name} className="h-16 w-16 text-lg sm:h-20 sm:w-20" />
          </div>
        )}
      </Link>

      <div className="flex h-[clamp(204px,58vw,232px)] min-w-0 flex-col gap-2 overflow-hidden p-3 sm:h-[clamp(196px,24vw,224px)] sm:gap-3 sm:p-4">
        <div className="min-w-0 overflow-hidden">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              {copy.supplierBadge}
            </span>
            {supplier.isCertified ? <CertifiedBadge className="min-h-6 rounded-md px-2 text-[10px]" /> : null}
          </div>

          <h3 className="line-clamp-2 text-lg font-black leading-tight text-gray-950 dark:text-white">
            {supplier.name}
          </h3>
          <p className="mt-1 line-clamp-1 max-w-2xl text-xs font-bold leading-5 text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-1.5">
          <div className="flex min-h-10 min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-white/5">
            <p className="truncate text-[10px] font-black uppercase leading-none text-gray-500 dark:text-gray-400">{copy.moqLabel}</p>
            <p className="mt-1 truncate text-xs font-black leading-none text-gray-950 dark:text-white">{moq}</p>
          </div>
          <div className="flex min-h-10 min-w-0 flex-col justify-center rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5 dark:border-orange-400/20 dark:bg-orange-400/10">
            <p className="truncate text-[10px] font-black uppercase leading-none text-orange-700 dark:text-orange-300">{copy.priceLabel}</p>
            <p className="mt-1 truncate text-xs font-black leading-none text-gray-950 dark:text-white">{price}</p>
          </div>
        </div>

        <div className="mt-auto flex justify-start overflow-hidden">
          <Link
            href={profileHref}
            className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-orange-500 px-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100 sm:min-h-10 sm:w-auto sm:min-w-44 sm:px-4 dark:bg-orange-500 dark:hover:bg-orange-400 dark:focus:ring-orange-400/20"
          >
            {copy.viewProfile}
          </Link>
        </div>
      </div>
    </article>
  );
}

function getSupplierCardCopy(language: string) {
  if (language === "en") {
    return {
      supplierBadge: "Supplier",
      priceLabel: "Wholesale Price",
      priceFallback: "On request",
      moqLabel: "MOQ",
      moqFallback: "Ask supplier",
      unitLabel: "units",
      descriptionFallback: "Wholesale supplier with a professional product catalog.",
      viewProfile: "View supplier",
    };
  }

  return {
    supplierBadge: "Grossiste",
    priceLabel: "Prix de gros",
    priceFallback: "Sur demande",
    moqLabel: "MOQ",
    moqFallback: "À confirmer",
    unitLabel: "unités minimum",
    descriptionFallback: "Fournisseur grossiste avec un catalogue professionnel.",
    viewProfile: "Voir le fournisseur",
  };
}

function formatMoq(value: string | number | undefined, copy: ReturnType<typeof getSupplierCardCopy>) {
  if (value === undefined || value === null || value === "") {
    return copy.moqFallback;
  }

  if (typeof value === "number") {
    return `${formatPrice(value)} ${copy.unitLabel}`;
  }

  if (/^\d+(\.\d+)?$/.test(value.trim())) {
    return `${formatPrice(Number(value))} ${copy.unitLabel}`;
  }

  return value;
}
