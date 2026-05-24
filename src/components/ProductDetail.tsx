"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { getSellerProfileHref } from "@/lib/seller";
import { getProductById } from "@/services/productService";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { FavoriteButton } from "@/ui/FavoriteButton";
import { PublishedTime } from "@/ui/PublishedTime";
import { SellerAvatar } from "@/ui/SellerAvatar";
import { WhatsappButton } from "@/ui/WhatsappButton";
import { WhatsappShareButton } from "@/ui/WhatsappShareButton";

type ProductDetailProps = {
  productId: string;
  initialProduct?: Product | null;
};

export function ProductDetail({ productId, initialProduct = null }: ProductDetailProps) {
  const { t, categoryLabel, countryLabel } = useLanguage();
  const [localProduct, setLocalProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(!initialProduct);

  useEffect(() => {
    if (initialProduct) {
      return;
    }

    let isMounted = true;

    async function loadProduct() {
      const foundProduct = await getProductById(productId);

      if (isMounted) {
        setLocalProduct(foundProduct);
        setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [initialProduct, productId]);

  const product = initialProduct || localProduct;

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-gray-100" />
          <div className="grid gap-4 p-4 md:p-6">
            <div className="h-7 w-2/3 animate-pulse rounded-full bg-gray-100" />
            <div className="h-8 w-40 animate-pulse rounded-full bg-gray-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 dark:border-white/10 dark:bg-gray-900">
          <h1 className="text-3xl font-black text-gray-950 dark:text-white">{t("product.notFoundTitle")}</h1>
          <p className="mt-3 text-gray-500 dark:text-gray-300">{t("product.notFoundText")}</p>
        </div>
      </section>
    );
  }

  const productLocation = product.location || categoryLabel(product.category);
  const sellerName = product.sellerName || t("product.seller");

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="relative aspect-[4/3] overflow-hidden bg-white p-4 dark:bg-gray-950">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain object-center"
          />
          <FavoriteButton productId={product.id} compact className="absolute left-3 top-3" />
          {product.isCertified ? (
            <CertifiedBadge className="absolute right-3 top-3" />
          ) : null}
        </div>

        <div className="grid gap-4 p-4 md:p-6">
          <div>
            {product.isCertified ? (
              <CertifiedBadge className="mb-2 w-fit" />
            ) : null}
            <h1 className="text-xl font-black text-gray-950 md:text-2xl dark:text-white">{product.title}</h1>
          </div>

          <p className="text-2xl font-black text-orange-500">{formatPrice(product.price)} FCFA</p>
          <PublishedTime date={product.createdAt} />

          <div className="grid gap-4 border-t border-gray-100 pt-4">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
              <p className="text-sm font-black text-gray-950 dark:text-white">{t("product.location")}</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{productLocation}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <SellerAvatar name={sellerName} photo={product.sellerPhoto} className="h-12 w-12 text-sm" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("product.seller")}</p>
                    <p className="font-black text-gray-950 dark:text-white">{sellerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {[countryLabel(product.country), product.city].filter(Boolean).join(" - ")}
                    </p>
                  </div>
                </div>
                <Link
                  href={getSellerProfileHref(product)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100 dark:hover:border-orange-300/40 dark:hover:text-orange-300"
                >
                  {t("product.sellerProfile")}
                </Link>
              </div>
            </div>

            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-950 dark:text-white">{t("product.descriptionHeading")}</h2>
              <p className="mt-2 block max-h-none overflow-visible whitespace-pre-wrap break-all leading-8 text-gray-700 dark:text-gray-200">
                {product.description}
              </p>
            </section>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10">
              <p className="text-sm font-black text-gray-950 dark:text-white">{t("product.securityTitle")}</p>
              <p className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{t("product.securityText")}</p>
              <a
                href={`mailto:support@shopfy.site?subject=${encodeURIComponent(`Signalement annonce ${product.id}`)}`}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-orange-200 bg-white px-4 text-sm font-black text-orange-600 transition hover:bg-orange-100 dark:border-orange-300/30 dark:bg-transparent dark:text-orange-300 dark:hover:bg-orange-300/10"
              >
                {t("product.reportListing")}
              </a>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <WhatsappButton phone={product.sellerPhone} className="min-h-11 w-full px-5" />
              <WhatsappShareButton product={product} className="min-h-11 w-full px-5" />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
