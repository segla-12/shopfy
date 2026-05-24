"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { FavoriteButton } from "@/ui/FavoriteButton";
import { PublishedTime } from "@/ui/PublishedTime";
import { WhatsappButton } from "@/ui/WhatsappButton";
import { WhatsappShareButton } from "@/ui/WhatsappShareButton";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();
  const isLocalImage = product.image.startsWith("data:");
  const detailHref = `/product/${encodeURIComponent(product.id)}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-gray-900">
      <div className="relative aspect-[4/3] overflow-hidden bg-white p-4 dark:bg-gray-950">
        <Link href={detailHref} className="block h-full">
          <Image
            src={product.image}
            alt={product.title}
            fill
            unoptimized={isLocalImage}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition duration-300 group-hover:scale-105"
          />
          {product.isNew ? (
            <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase text-white">
              {t("product.new")}
            </span>
          ) : null}
          {product.isCertified ? (
            <CertifiedBadge className="absolute bottom-3 left-3" />
          ) : null}
        </Link>
        <FavoriteButton productId={product.id} compact className="absolute right-3 top-3 z-10" />
      </div>

      <div className="grid gap-3 p-4">
        <div>
          {product.isCertified ? (
            <CertifiedBadge className="mb-2 w-fit" />
          ) : null}
          <h3 className="line-clamp-2 text-base font-black text-gray-950 dark:text-white">{product.title}</h3>
        </div>

        <p className="text-xl font-black text-orange-500">{formatPrice(product.price)} FCFA</p>
        <PublishedTime date={product.createdAt} />

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={detailHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-gray-200 text-sm font-bold text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100 dark:hover:border-orange-300/40 dark:hover:text-orange-300"
          >
            {t("product.viewDetails")}
          </Link>
          <WhatsappButton phone={product.sellerPhone} />
          <WhatsappShareButton product={product} className="sm:col-span-2" />
        </div>
      </div>
    </article>
  );
}
