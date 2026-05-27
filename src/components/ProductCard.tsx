"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { getSellerProfileHref } from "@/lib/seller";
import { createWhatsappUrl } from "@/lib/whatsapp";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { FavoriteButton } from "@/ui/FavoriteButton";

type ProductCardProps = {
  product: Product;
  action?: "supplier" | "none" | "order";
};

export function ProductCard({ product, action = "supplier" }: ProductCardProps) {
  const { language, t } = useLanguage();
  const isLocalImage = product.image.startsWith("data:");
  const supplierHref = getSellerProfileHref(product);
  const copy = getProductCardCopy(language);
  const moq = formatMoq(product, copy);
  const wholesalePrice = formatWholesalePrice(product, copy);
  const orderHref = createWhatsappUrl(product.sellerPhone, t("whatsapp.message"));
  const imageContent = (
    <>
      <Image
        src={product.image}
        alt={product.title}
        fill
        unoptimized={isLocalImage}
        sizes="(min-width: 640px) 192px, 132px"
        className="object-contain object-center p-3"
      />
      {product.isNew ? (
        <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-1 text-[10px] font-black uppercase text-white shadow-sm sm:left-3 sm:top-3">
          {t("product.new")}
        </span>
      ) : null}
    </>
  );

  return (
    <article className="group relative grid grid-cols-[132px_minmax(0,1fr)] items-start overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition duration-200 hover:border-orange-300 hover:shadow-md dark:border-white/10 dark:bg-gray-900 sm:grid-cols-[192px_minmax(0,1fr)]">
      <div className="relative h-[clamp(204px,58vw,232px)] overflow-hidden border-r border-gray-100 bg-white sm:h-[clamp(196px,24vw,224px)] dark:border-white/10 dark:bg-gray-950">
        {action === "supplier" ? (
          <Link href={supplierHref} className="relative block h-full">
            {imageContent}
          </Link>
        ) : (
          <div className="relative block h-full">
            {imageContent}
          </div>
        )}
        <FavoriteButton productId={product.id} compact className="absolute bottom-2 left-2 z-10 h-9 w-9 sm:bottom-3 sm:left-3" />
      </div>

      <div className="flex h-[clamp(204px,58vw,232px)] min-w-0 flex-col gap-2 overflow-hidden p-3 sm:h-[clamp(196px,24vw,224px)] sm:gap-3 sm:p-4">
        <div className="min-w-0 overflow-hidden">
          {product.isCertified ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 pr-2">
              <CertifiedBadge className="min-h-6 rounded-md px-2 text-[10px]" />
            </div>
          ) : null}
          <h3 className="line-clamp-2 text-base font-black leading-snug text-gray-950 sm:text-lg dark:text-white">
            {product.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm leading-5 text-gray-600 sm:line-clamp-2 sm:leading-6 dark:text-gray-300">
            {product.description}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-1.5">
          <div className="flex min-h-10 min-w-0 flex-col justify-center rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5 dark:border-orange-400/20 dark:bg-orange-400/10">
            <p className="truncate text-[10px] font-black uppercase leading-none text-orange-700 dark:text-orange-300">{copy.moqLabel}</p>
            <p className="mt-1 truncate text-xs font-black leading-none text-gray-950 dark:text-white">{moq}</p>
          </div>
          <div className="flex min-h-10 min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-white/5">
            <p className="truncate text-[10px] font-black uppercase leading-none text-gray-500 dark:text-gray-400">{copy.wholesalePriceLabel}</p>
            <p className="mt-1 truncate text-xs font-black leading-none text-gray-950 dark:text-white">{wholesalePrice}</p>
          </div>
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-2 overflow-hidden sm:flex-row sm:items-center sm:justify-between">
          <p className="line-clamp-1 text-xs font-bold text-gray-500 dark:text-gray-400">{copy.wholesaleOnly}</p>
          {action === "supplier" ? (
            <Link
              href={supplierHref}
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-orange-500 px-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100 sm:min-h-10 sm:min-w-40 sm:px-4 dark:bg-orange-500 dark:hover:bg-orange-400 dark:focus:ring-orange-400/20"
            >
              {copy.viewSupplier}
            </Link>
          ) : null}
          {action === "order" ? (
            <a
              href={orderHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-green-500 px-3 text-sm font-black text-white shadow-sm transition hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-100 sm:min-h-10 sm:min-w-40 sm:px-4 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400/20"
            >
              {copy.order}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function getProductCardCopy(language: string) {
  if (language === "en") {
    return {
      moqLabel: "MOQ",
      moqFallback: "Ask supplier",
      unitLabel: "units",
      wholesalePriceLabel: "Wholesale Price",
      priceOnRequest: "On request",
      order: "Order",
      viewSupplier: "View supplier",
      wholesaleOnly: "Wholesale marketplace",
    };
  }

  return {
    moqLabel: "MOQ",
    moqFallback: "À confirmer",
    unitLabel: "unités minimum",
    wholesalePriceLabel: "Prix de gros",
    priceOnRequest: "Sur demande",
    order: "Commander",
    viewSupplier: "Voir le fournisseur",
    wholesaleOnly: "Marketplace grossistes",
  };
}

function formatMoq(product: Product, copy: ReturnType<typeof getProductCardCopy>) {
  const rawMoq = product.minimumOrderQuantity;

  if (rawMoq === undefined || rawMoq === null || rawMoq === "") {
    return copy.moqFallback;
  }

  if (typeof rawMoq === "number") {
    return `${formatPrice(rawMoq)} ${copy.unitLabel}`;
  }

  if (/^\d+(\.\d+)?$/.test(rawMoq.trim())) {
    return `${formatPrice(Number(rawMoq))} ${copy.unitLabel}`;
  }

  return rawMoq;
}

function formatWholesalePrice(product: Product, copy: ReturnType<typeof getProductCardCopy>) {
  const price = product.wholesalePrice ?? product.price;

  if (!Number.isFinite(price) || price <= 0) {
    return copy.priceOnRequest;
  }

  return `${formatPrice(price)} FCFA`;
}
