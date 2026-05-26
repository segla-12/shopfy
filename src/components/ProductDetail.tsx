"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { getSellerProfileHref } from "@/lib/seller";
import { createWhatsappUrl, normalizeWhatsappPhone } from "@/lib/whatsapp";
import { getProductById, getProductsByPhone } from "@/services/productService";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { FavoriteButton } from "@/ui/FavoriteButton";
import { PublishedTime } from "@/ui/PublishedTime";
import { SellerAvatar } from "@/ui/SellerAvatar";

type ProductDetailProps = {
  productId: string;
  initialProduct?: Product | null;
};

export function ProductDetail({ productId, initialProduct = null }: ProductDetailProps) {
  const { language, t, categoryLabel, countryLabel } = useLanguage();
  const [localProduct, setLocalProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const copy = getProductDetailWholesaleCopy(language);

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

  useEffect(() => {
    if (!product?.sellerPhone) {
      return;
    }

    let isMounted = true;

    async function loadSupplierProducts() {
      const products = await getProductsByPhone(product?.sellerPhone || "");

      if (isMounted) {
        setSupplierProducts(products);
      }
    }

    loadSupplierProducts();

    return () => {
      isMounted = false;
    };
  }, [product?.sellerPhone]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
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

  const galleryImages = (product.images && product.images.length > 0 ? product.images : [product.image]).slice(0, 3);
  const safeSelectedImageIndex = Math.min(selectedImageIndex, Math.max(0, galleryImages.length - 1));
  const selectedImage = galleryImages[safeSelectedImageIndex] || galleryImages[0] || product.image;
  const productLocation = product.location || product.city || categoryLabel(product.category);
  const locationText = [countryLabel(product.country), product.city || productLocation].filter(Boolean).join(" - ");
  const coordinatesText = formatCoordinates(product.latitude, product.longitude);
  const sellerName = product.sellerName || t("product.seller");
  const deliveryContactHref = getDeliveryContactHref(product.deliveryContact, copy.deliveryMessage);
  const supplierIsCertified = Boolean(product.isCertified || supplierProducts.some((supplierProduct) => supplierProduct.isCertified));

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <article className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="border-b border-gray-100 bg-white p-3 sm:p-4 lg:border-b-0 lg:border-r dark:border-white/10 dark:bg-gray-950">
            <div className="relative">
              <button
                type="button"
                aria-label={copy.openPhoto}
                onClick={() => setEnlargedImage(selectedImage)}
                className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white p-3 transition hover:border-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:focus:ring-orange-400/20"
              >
                <img
                  src={selectedImage}
                  alt={product.title}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-contain object-center"
                />
              </button>

              <FavoriteButton productId={product.id} compact className="absolute left-3 top-3" />
              {supplierIsCertified ? (
                <CertifiedBadge className="absolute right-3 top-3" />
              ) : null}
            </div>

            {galleryImages.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    aria-label={copy.photoLabel(index + 1)}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded-md border bg-white p-1 transition focus:outline-none focus:ring-4 focus:ring-orange-100 dark:bg-gray-950 dark:focus:ring-orange-400/20 ${
                      safeSelectedImageIndex === index
                        ? "border-orange-400 shadow-sm"
                        : "border-gray-200 hover:border-orange-200 dark:border-white/10"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain object-center"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 p-4 md:p-6">
            <div>
              {supplierIsCertified ? (
                <CertifiedBadge className="mb-2 w-fit" />
              ) : null}
              <h1 className="text-xl font-black leading-tight text-gray-950 md:text-2xl dark:text-white">{product.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-2xl font-black text-orange-500">{formatPrice(product.price)} FCFA</p>
              {product.minimumOrderQuantity ? (
                <span className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-black text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300">
                  MOQ: {product.minimumOrderQuantity}
                </span>
              ) : null}
            </div>
            <PublishedTime date={product.createdAt} />

            <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10">
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-950 dark:text-white">{copy.deliveryTitle}</h2>
              <div className="mt-3 grid gap-3 text-sm">
                <DetailLine label={copy.deliveryMethodLabel} value={product.deliveryMethod || copy.notSpecified} />
                <DetailLine label={copy.deliveryServiceLabel} value={product.deliveryServiceName || copy.notSpecified} />
                <div>
                  <p className="text-xs font-black uppercase text-orange-700 dark:text-orange-300">{copy.deliveryContactLabel}</p>
                  {product.deliveryContact && deliveryContactHref ? (
                    <a
                      href={deliveryContactHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-10 items-center justify-center rounded-md bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600"
                    >
                      {product.deliveryContact}
                    </a>
                  ) : (
                    <p className="mt-1 font-black text-gray-950 dark:text-white">{product.deliveryContact || copy.notSpecified}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-950 dark:text-white">{copy.locationTitle}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <DetailLine label={t("product.location")} value={locationText || productLocation} />
                <DetailLine label={copy.coordinatesLabel} value={coordinatesText || copy.coordinatesUnavailable} />
              </div>
            </section>

            <section className="rounded-lg border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <SellerAvatar name={sellerName} photo={product.sellerPhoto} className="h-12 w-12 text-sm" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("product.seller")}</p>
                    <p className="font-black text-gray-950 dark:text-white">{sellerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">{locationText}</p>
                  </div>
                </div>
                <Link
                  href={getSellerProfileHref(product)}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100 dark:hover:border-orange-300/40 dark:hover:text-orange-300"
                >
                  {t("product.sellerProfile")}
                </Link>
              </div>
            </section>

          </div>
        </div>

        <div className="grid gap-4 border-t border-gray-100 p-4 md:p-6 dark:border-white/10">
          <section>
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-950 dark:text-white">{t("product.descriptionHeading")}</h2>
            <p className="mt-2 block max-h-none overflow-visible whitespace-pre-wrap break-words leading-8 text-gray-700 dark:text-gray-200">
              {product.description}
            </p>
          </section>

          <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10">
            <p className="text-sm font-black text-gray-950 dark:text-white">{t("product.securityTitle")}</p>
            <p className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{t("product.securityText")}</p>
            <a
              href={`mailto:support@shopfy.site?subject=${encodeURIComponent(`Signalement annonce ${product.id}`)}`}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-orange-200 bg-white px-4 text-sm font-black text-orange-600 transition hover:bg-orange-100 dark:border-orange-300/30 dark:bg-transparent dark:text-orange-300 dark:hover:bg-orange-300/10"
            >
              {t("product.reportListing")}
            </a>
          </div>
        </div>
      </article>

      {enlargedImage ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            type="button"
            aria-label={copy.closePhoto}
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-black text-gray-950 shadow-lg transition hover:bg-orange-50"
          >
            ×
          </button>
          <img
            src={enlargedImage}
            alt={product.title}
            decoding="async"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[86vh] max-w-[94vw] rounded-lg bg-white object-contain p-2 shadow-2xl"
          />
        </div>
      ) : null}
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function getDeliveryContactHref(contact: string | undefined, message: string) {
  if (!contact || normalizeWhatsappPhone(contact).length < 6) {
    return undefined;
  }

  return createWhatsappUrl(contact, message);
}

function formatCoordinates(latitude: number | undefined, longitude: number | undefined) {
  if (latitude === undefined || longitude === undefined) {
    return "";
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function getProductDetailWholesaleCopy(language: string) {
  if (language === "en") {
    return {
      deliveryTitle: "Delivery information",
      deliveryMethodLabel: "Method",
      deliveryServiceLabel: "Service",
      deliveryContactLabel: "Contact",
      deliveryMessage: "Hello, I want to confirm delivery for this product.",
      locationTitle: "Wholesale location",
      coordinatesLabel: "GPS coordinates",
      coordinatesUnavailable: "Ready for geo search",
      notSpecified: "To confirm",
      openPhoto: "Enlarge product photo",
      closePhoto: "Close enlarged photo",
      photoLabel: (index: number) => `View product photo ${index}`,
    };
  }

  return {
    deliveryTitle: "Informations de livraison",
    deliveryMethodLabel: "Moyen",
    deliveryServiceLabel: "Service",
    deliveryContactLabel: "Contact",
    deliveryMessage: "Bonjour, je veux confirmer la livraison pour ce produit.",
    locationTitle: "Localisation grossiste",
    coordinatesLabel: "Coordonnées GPS",
    coordinatesUnavailable: "Prêt pour la recherche géographique",
    notSpecified: "À confirmer",
    openPhoto: "Agrandir la photo du produit",
    closePhoto: "Fermer la photo agrandie",
    photoLabel: (index: number) => `Voir la photo produit ${index}`,
  };
}
