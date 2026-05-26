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
        sizes="(min-width: 1024px) 192px, (min-width: 640px) 176px, 118px"
        className="object-contain p-3 transition duration-300 group-hover:scale-[1.03] sm:p-4"
      />
      {product.isNew ? (
        <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-1 text-[10px] font-black uppercase text-white shadow-sm sm:left-3 sm:top-3">
          {t("product.new")}
        </span>
      ) : null}
    </>
  );

  return (
    <article className="group relative flex min-h-[168px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition duration-200 hover:border-orange-300 hover:shadow-md dark:border-white/10 dark:bg-gray-900">
      <div className="relative w-[118px] shrink-0 overflow-hidden border-r border-gray-100 bg-white sm:w-48 dark:border-white/10 dark:bg-gray-950">
        {action === "supplier" ? (
          <Link href={supplierHref} className="relative block h-full min-h-[168px] p-3 sm:p-4">
            {imageContent}
          </Link>
        ) : (
          <div className="relative block h-full min-h-[168px] p-3 sm:p-4">
            {imageContent}
          </div>
        )}
        <FavoriteButton productId={product.id} compact className="absolute bottom-2 left-2 z-10 h-9 w-9 sm:bottom-3 sm:left-3" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          {product.isCertified ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 pr-2">
              <CertifiedBadge className="min-h-6 rounded-md px-2 text-[10px]" />
            </div>
          ) : null}
          <h3 className="line-clamp-2 text-base font-black leading-snug text-gray-950 sm:text-lg dark:text-white">
            {product.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {product.description}
          </p>
        </div>

        <div className={action === "order" ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"}>
          <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 dark:border-orange-400/20 dark:bg-orange-400/10">
            <p className="text-[11px] font-black uppercase text-orange-700 dark:text-orange-300">{copy.moqLabel}</p>
            <p className="mt-0.5 text-sm font-black text-gray-950 dark:text-white">{moq}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400">{copy.wholesalePriceLabel}</p>
            <p className="mt-0.5 text-sm font-black text-gray-950 dark:text-white">{wholesalePrice}</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{copy.wholesaleOnly}</p>
          {action === "supplier" ? (
            <Link
              href={supplierHref}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100 sm:min-w-40 dark:bg-orange-500 dark:hover:bg-orange-400 dark:focus:ring-orange-400/20"
            >
              {copy.viewSupplier}
            </Link>
          ) : null}
          {action === "order" ? (
            <a
              href={orderHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-green-500 px-4 text-sm font-black text-white shadow-sm transition hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-100 sm:min-w-40 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400/20"
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
      unitLabel: "units minimum",
      wholesalePriceLabel: "Wholesale price",
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

  return rawMoq;
}

function formatWholesalePrice(product: Product, copy: ReturnType<typeof getProductCardCopy>) {
  const price = product.wholesalePrice ?? product.price;

  if (!Number.isFinite(price) || price <= 0) {
    return copy.priceOnRequest;
  }

  return `${formatPrice(price)} FCFA`;
}
