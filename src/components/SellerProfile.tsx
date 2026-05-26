"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { useLanguage } from "@/lib/language";
import { buildWholesaleSuppliers, getSupplierProductsForCatalog } from "@/lib/supplierDirectory";
import { getProductsByPhone } from "@/services/productService";
import type { Product, WholesaleSupplier } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { SellerAvatar } from "@/ui/SellerAvatar";
import { WhatsappButton } from "@/ui/WhatsappButton";

type SellerProfileProps = {
  sellerPhone: string;
};

export function SellerProfile({ sellerPhone }: SellerProfileProps) {
  const { language, categoryLabel, countryLabel } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const copy = getSupplierProfileCopy(language);

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

  const supplier = useMemo(() => buildWholesaleSuppliers(products)[0], [products]);
  const catalogProducts = useMemo(() => {
    const sortedProducts = getSupplierProductsForCatalog(products);

    if (!supplier?.isCertified) {
      return sortedProducts;
    }

    return sortedProducts.map((product) => ({
      ...product,
      isCertified: true,
    }));
  }, [products, supplier?.isCertified]);
  const joinedDate = formatJoinedDate(supplier, language);
  const locationText = supplier
    ? [countryLabel(supplier.country), supplier.city || supplier.location].filter(Boolean).join(" - ")
    : "";
  const categoriesText = supplier?.categories.map(categoryLabel).join(" / ") || copy.notSpecified;
  const deliveryMethodsText = supplier?.deliveryMethods.join(" / ") || copy.notSpecified;
  const deliveryServicesText = supplier?.deliveryServices.join(" / ") || copy.notSpecified;
  const deliveryContact = supplier?.deliveryContacts[0] || sellerPhone;
  const coordinatesText = supplier ? formatCoordinates(supplier.latitude, supplier.longitude) : "";

  if (!isLoading && !supplier) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
          <h1 className="text-2xl font-black text-gray-950 dark:text-white">{copy.emptyTitle}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{copy.emptyText}</p>
          <Link href="/#products" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600">
            {copy.back}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-5 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <SellerAvatar name={supplier?.name || copy.loadingName} photo={supplier?.photo} className="h-24 w-24 text-2xl" />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-black uppercase text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300">
                  {copy.kicker}
                </p>
                {supplier?.isCertified ? <CertifiedBadge className="min-h-7 rounded-md" /> : null}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl dark:text-white">
                {supplier?.name || copy.loadingName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-gray-500 dark:text-gray-300">
                {copy.permanentProfile} {joinedDate ? copy.since(joinedDate) : ""}
              </p>
            </div>
          </div>

          <WhatsappButton phone={deliveryContact} label={copy.orderSupplier} className="min-h-12 rounded-md px-6 text-base" />
        </div>

        <div className="grid border-t border-gray-100 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileStat label={copy.locationLabel} value={locationText || copy.notSpecified} />
          <ProfileStat label={copy.catalogLabel} value={isLoading ? "..." : copy.productCount(catalogProducts.length)} />
          <ProfileStat label={copy.categoriesLabel} value={categoriesText} />
          <ProfileStat label={copy.contactLabel} value={sellerPhone} />
        </div>
      </div>

      <div className="mb-7 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10">
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-950 dark:text-white">{copy.deliveryTitle}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ProfileStat compact label={copy.deliveryMethodLabel} value={deliveryMethodsText} />
            <ProfileStat compact label={copy.deliveryServiceLabel} value={deliveryServicesText} />
            <ProfileStat compact label={copy.deliveryContactLabel} value={deliveryContact} />
          </div>
        </section>

        <section className="rounded-lg border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-gray-900">
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-950 dark:text-white">{copy.locationAdvancedTitle}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ProfileStat compact label={copy.areaLabel} value={locationText || copy.notSpecified} />
            <ProfileStat compact label={copy.coordinatesLabel} value={coordinatesText || copy.coordinatesReady} />
          </div>
        </section>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.catalogKicker}</p>
          <h2 className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{copy.catalogTitle}</h2>
        </div>
      </div>

      {catalogProducts.length > 0 ? (
        <ProductGrid products={catalogProducts} action="order" />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
          <h2 className="text-lg font-black text-gray-950 dark:text-white">{copy.noProducts}</h2>
          <Link href="/#products" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600">
            {copy.back}
          </Link>
        </div>
      )}
    </section>
  );
}

function ProfileStat({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={compact ? "rounded-md border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5" : "border-t border-gray-100 p-5 dark:border-white/10 sm:border-l sm:border-t-0"}>
      <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function formatJoinedDate(supplier: WholesaleSupplier | undefined, language: string) {
  if (!supplier?.firstJoinedAt) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(supplier.firstJoinedAt));
}

function formatCoordinates(latitude: number | undefined, longitude: number | undefined) {
  if (latitude === undefined || longitude === undefined) {
    return "";
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function getSupplierProfileCopy(language: string) {
  if (language === "en") {
    return {
      kicker: "Wholesale supplier",
      loadingName: "Supplier",
      permanentProfile: "Permanent supplier profile.",
      since: (date: string) => `Supplier listed since ${date}.`,
      orderSupplier: "Order",
      locationLabel: "Location",
      catalogLabel: "Catalog",
      categoriesLabel: "Categories",
      contactLabel: "Main contact",
      deliveryTitle: "Delivery methods",
      deliveryMethodLabel: "Methods",
      deliveryServiceLabel: "Services",
      deliveryContactLabel: "Delivery contact",
      locationAdvancedTitle: "Sourcing area",
      areaLabel: "Country and city",
      coordinatesLabel: "GPS coordinates",
      coordinatesReady: "Ready for future geo search",
      catalogKicker: "Supplier catalog",
      catalogTitle: "Products from this supplier",
      noProducts: "No product in this supplier catalog yet.",
      emptyTitle: "Supplier not found",
      emptyText: "This supplier profile has no active catalog.",
      back: "Back to suppliers",
      notSpecified: "To confirm",
      productCount: (count: number) => `${count} product${count > 1 ? "s" : ""}`,
    };
  }

  return {
    kicker: "Fournisseur grossiste",
    loadingName: "Fournisseur",
    permanentProfile: "Profil fournisseur permanent.",
    since: (date: string) => `Fournisseur référencé depuis le ${date}.`,
    orderSupplier: "Commander",
    locationLabel: "Localisation",
    catalogLabel: "Catalogue",
    categoriesLabel: "Catégories",
    contactLabel: "Contact principal",
    deliveryTitle: "Moyens de livraison",
    deliveryMethodLabel: "Moyens",
    deliveryServiceLabel: "Services",
    deliveryContactLabel: "Contact livraison",
    locationAdvancedTitle: "Zone de sourcing",
    areaLabel: "Pays et ville",
    coordinatesLabel: "Coordonnées GPS",
    coordinatesReady: "Prêt pour la future recherche géographique",
    catalogKicker: "Catalogue fournisseur",
    catalogTitle: "Produits de ce fournisseur",
    noProducts: "Aucun produit dans ce catalogue fournisseur.",
    emptyTitle: "Fournisseur introuvable",
    emptyText: "Ce profil fournisseur n'a pas encore de catalogue actif.",
    back: "Retour aux fournisseurs",
    notSpecified: "À confirmer",
    productCount: (count: number) => `${count} produit${count > 1 ? "s" : ""}`,
  };
}
