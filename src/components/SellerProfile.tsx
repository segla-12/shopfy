"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { useLanguage } from "@/lib/language";
import { getSellerDisplayName } from "@/lib/seller";
import { getProductsByPhone } from "@/services/productService";
import type { Product } from "@/types/marketplace";
import { SellerAvatar } from "@/ui/SellerAvatar";
import { WhatsappButton } from "@/ui/WhatsappButton";

type SellerProfileProps = {
  sellerPhone: string;
};

export function SellerProfile({ sellerPhone }: SellerProfileProps) {
  const { language, t, countryLabel } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSellerProducts() {
      const loadedProducts = await getProductsByPhone(sellerPhone);

      if (isMounted) {
        setProducts(loadedProducts);
        setIsLoading(false);
      }
    }

    loadSellerProducts();

    return () => {
      isMounted = false;
    };
  }, [sellerPhone]);

  const sellerProduct = products[0];
  const sellerName = getSellerDisplayName(sellerProduct);
  const joinedAt = useMemo(() => {
    const dates = products
      .map((product) => product.createdAt)
      .filter(Boolean)
      .map((date) => new Date(String(date)).getTime())
      .filter((time) => Number.isFinite(time));

    return dates.length > 0 ? new Date(Math.min(...dates)) : null;
  }, [products]);

  const joinedDate = joinedAt
    ? new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(joinedAt)
    : "-";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-7 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <SellerAvatar name={sellerName} photo={sellerProduct?.sellerPhoto} className="h-24 w-24 text-2xl" />
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-500">{t("seller.kicker")}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 dark:text-white">{sellerName}</h1>
              <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-300">
                {t("seller.joined", { date: joinedDate })}
              </p>
            </div>
          </div>

          <WhatsappButton phone={sellerPhone} label={t("product.contactSeller")} className="min-h-11 px-5" />
        </div>

        <div className="grid border-t border-gray-100 dark:border-white/10 sm:grid-cols-3">
          <ProfileStat label={t("seller.country")} value={countryLabel(sellerProduct?.country) || "-"} />
          <ProfileStat label={t("seller.city")} value={sellerProduct?.city || sellerProduct?.location || "-"} />
          <ProfileStat label={t("seller.listings")} value={isLoading ? "..." : String(products.length)} />
        </div>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
          <h2 className="text-lg font-black text-gray-950 dark:text-white">{t("seller.empty")}</h2>
          <Link href="/#products" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600">
            {t("seller.back")}
          </Link>
        </div>
      )}
    </section>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-gray-100 p-5 dark:border-white/10 sm:border-l sm:border-t-0">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}
