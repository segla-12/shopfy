"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { formatPrice } from "@/lib/format";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language";
import { buildWholesaleSuppliers } from "@/lib/supplierDirectory";
import { getProducts } from "@/services/productService";
import { getSupabaseStores } from "@/services/storeService";
import type { Product, WholesaleSupplier } from "@/types/marketplace";
import type { ShopfyStore } from "@/types/storefront";
import { CertifiedBadge } from "@/ui/CertifiedBadge";

type MessageState = {
  key: TranslationKey;
  values?: Record<string, string | number>;
};

export default function AdminPage() {
  const { language, t, categoryLabel } = useLanguage();
  const [adminSecret, setAdminSecret] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<ShopfyStore[]>([]);
  const [certificationDates, setCertificationDates] = useState<Record<string, string>>({});
  const [certificationDurations, setCertificationDurations] = useState<Record<string, number>>({});
  const [storeCertificationDates, setStoreCertificationDates] = useState<Record<string, string>>({});
  const [storeCertificationDurations, setStoreCertificationDurations] = useState<Record<string, number>>({});
  const suppliers = useMemo(() => buildWholesaleSuppliers(products), [products]);
  const supplierCopy = getAdminSupplierCopy(language);
  const storeCopy = getAdminStoreCopy(language);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminSecret }),
    });
    const result = await response.json();

    if (!result.success) {
      setMessage({ key: getAdminMessageKey(result.message, "admin.incorrectCode") });
      setIsLoading(false);
      return;
    }

    const [loadedProducts, loadedStores] = await Promise.all([
      getProducts(),
      getSupabaseStores(),
    ]);

    setProducts(loadedProducts);
    setStores(loadedStores);
    setIsUnlocked(true);
    setIsLoading(false);
  }

  async function handleCertification(product: Product, isCertified: boolean) {
    setIsLoading(true);
    setMessage(null);

    const durationMonths = certificationDurations[product.id] || 1;
    const certificationStartDate = certificationDates[product.id] || getTodayInputDate();
    const response = await fetch("/api/admin/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminSecret,
        productId: product.id,
        isCertified,
        certificationStartDate,
        durationMonths,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage({ key: getAdminMessageKey(result.message, "admin.actionDenied") });
      setIsLoading(false);
      return;
    }

    const loadedProducts = await getProducts();
    setProducts(loadedProducts);
    setMessage(result.message
      ? { key: getAdminMessageKey(result.message, "admin.actionDenied") }
      : {
          key: getCertificationMessageKey(isCertified, durationMonths),
          values: { count: durationMonths },
        });
    setIsLoading(false);
  }

  async function handleStoreCertification(store: ShopfyStore, isCertified: boolean) {
    setIsLoading(true);
    setMessage(null);

    const durationMonths = storeCertificationDurations[store.slug] || 1;
    const certificationStartDate = storeCertificationDates[store.slug] || getTodayInputDate();
    const response = await fetch("/api/admin/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminSecret,
        storeSlug: store.slug,
        isCertified,
        certificationStartDate,
        durationMonths,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage({ key: getAdminMessageKey(result.message, "admin.actionDenied") });
      setIsLoading(false);
      return;
    }

    const loadedStores = await getSupabaseStores();
    setStores(loadedStores);
    setMessage(result.message
      ? { key: getAdminMessageKey(result.message, "admin.actionDenied") }
      : {
          key: getStoreCertificationMessageKey(isCertified, durationMonths),
          values: { count: durationMonths },
        });
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{t("admin.kicker")}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 dark:text-white">{t("admin.title")}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600 dark:text-gray-300">
            {t("admin.description")}
          </p>
        </div>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="grid max-w-xl gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
            <label className="grid gap-2">
              <span className="text-sm font-black text-gray-900">{t("admin.codeLabel")}</span>
              <input
                value={adminSecret}
                onChange={(event) => setAdminSecret(event.target.value)}
                required
                type="password"
                suppressHydrationWarning
                placeholder={t("admin.codePlaceholder")}
                className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <button disabled={isLoading} className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">
              {isLoading ? t("admin.verifying") : t("admin.enter")}
            </button>
          </form>
        ) : (
          <div className="grid gap-6">
            {message ? (
              <p className="rounded-2xl border border-gray-100 bg-white p-4 text-sm font-bold text-gray-700">
                {t(message.key, message.values)}
              </p>
            ) : null}

            <section className="grid gap-3">
              <div>
                <h2 className="text-2xl font-black text-gray-950 dark:text-white">{supplierCopy.title}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-300">{supplierCopy.description}</p>
              </div>

              {suppliers.map((supplier) => {
                const product = getSupplierCertificationProduct(supplier);

                if (!product) {
                  return null;
                }

                const categories = supplier.categories.map(categoryLabel).join(" / ");

                return (
                  <article key={supplier.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img src={supplier.photo || supplier.firstProductImage || product.image} alt={supplier.name} className="h-28 w-28 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-gray-950">{supplier.name}</h3>
                          {supplier.isCertified ? <CertifiedBadge /> : null}
                        </div>
                        <p className="mt-1 font-black text-orange-500">{supplierCopy.productCount(supplier.productCount)}</p>
                        <p className="mt-1 text-sm text-gray-500">{categories || supplierCopy.noCategory}</p>
                        <div className="mt-3 grid gap-1 text-sm text-gray-500">
                          <p>{t("admin.certificationLabel")}: {getCertificationStatus(product, t)}</p>
                          <p>{t("admin.expirationLabel")}: {formatCertificationDate(product.certificationExpiresAt, language, t)}</p>
                          <p>{t("admin.amountLabel")}: {formatPrice(product.certificationAmount || getCertificationAmount(certificationDurations[product.id] || 1))} FCFA</p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:w-64">
                        <label className="grid gap-1">
                          <span className="text-xs font-black uppercase tracking-wide text-gray-500">{t("admin.startDateLabel")}</span>
                          <input
                            type="date"
                            suppressHydrationWarning
                            value={certificationDates[product.id] || getTodayInputDate()}
                            onChange={(event) => setCertificationDates((dates) => ({
                              ...dates,
                              [product.id]: event.target.value,
                            }))}
                            className="min-h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-xs font-black uppercase tracking-wide text-gray-500">{t("admin.durationLabel")}</span>
                          <select
                            value={certificationDurations[product.id] || 1}
                            suppressHydrationWarning
                            onChange={(event) => setCertificationDurations((durations) => ({
                              ...durations,
                              [product.id]: Number(event.target.value),
                            }))}
                            className="min-h-10 rounded-xl border border-gray-200 px-3 text-sm font-bold outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                          >
                            {[1, 2, 3, 6, 12].map((months) => (
                              <option key={months} value={months}>{formatDurationOption(months, t)}</option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleCertification(product, true)}
                          disabled={isLoading}
                          className="min-h-10 rounded-full bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {product.isCertified ? t("admin.renew") : t("admin.certify")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCertification(product, false)}
                          disabled={isLoading || !product.isCertified}
                          className="min-h-10 rounded-full border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t("admin.removeCertification")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-3">
              <div>
                <h2 className="text-2xl font-black text-gray-950 dark:text-white">{storeCopy.title}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-300">{storeCopy.description}</p>
              </div>

              {stores.length === 0 ? (
                <p className="rounded-2xl border border-gray-100 bg-white p-4 text-sm font-bold text-gray-500 shadow-sm">
                  {storeCopy.noStores}
                </p>
              ) : (
                stores.map((store) => (
                  <article key={store.slug} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img src={store.logoUrl || store.bannerUrl} alt={store.name} className="h-28 w-28 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-gray-950">{store.name}</h3>
                          {store.isCertified ? <CertifiedBadge label={storeCopy.certifiedBadge} /> : null}
                        </div>
                        <p className="mt-1 font-black text-orange-500">@{store.slug}</p>
                        <p className="mt-1 text-sm text-gray-500">{store.city}, {store.country}</p>
                        <div className="mt-3 grid gap-1 text-sm text-gray-500">
                          <p>{t("admin.certificationLabel")}: {getStoreCertificationStatus(store, t)}</p>
                          <p>{t("admin.expirationLabel")}: {formatCertificationDate(store.certificationExpiresAt, language, t)}</p>
                          <p>{t("admin.amountLabel")}: {formatPrice(store.certificationAmount || getCertificationAmount(storeCertificationDurations[store.slug] || 1))} FCFA</p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:w-64">
                        <label className="grid gap-1">
                          <span className="text-xs font-black uppercase tracking-wide text-gray-500">{t("admin.startDateLabel")}</span>
                          <input
                            type="date"
                            suppressHydrationWarning
                            value={storeCertificationDates[store.slug] || getTodayInputDate()}
                            onChange={(event) => setStoreCertificationDates((dates) => ({
                              ...dates,
                              [store.slug]: event.target.value,
                            }))}
                            className="min-h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-xs font-black uppercase tracking-wide text-gray-500">{t("admin.durationLabel")}</span>
                          <select
                            value={storeCertificationDurations[store.slug] || 1}
                            suppressHydrationWarning
                            onChange={(event) => setStoreCertificationDurations((durations) => ({
                              ...durations,
                              [store.slug]: Number(event.target.value),
                            }))}
                            className="min-h-10 rounded-xl border border-gray-200 px-3 text-sm font-bold outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                          >
                            {[1, 2, 3, 6, 12].map((months) => (
                              <option key={months} value={months}>{formatDurationOption(months, t)}</option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleStoreCertification(store, true)}
                          disabled={isLoading}
                          className="min-h-10 rounded-full bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {store.isCertified ? t("admin.renew") : t("admin.certify")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStoreCertification(store, false)}
                          disabled={isLoading || !store.isCertified}
                          className="min-h-10 rounded-full border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t("admin.removeCertification")}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

function getSupplierCertificationProduct(supplier: WholesaleSupplier) {
  return supplier.products.find((product) => product.isCertified) || supplier.products[0];
}

function getAdminSupplierCopy(language: "fr" | "en") {
  if (language === "en") {
    return {
      title: "Wholesale suppliers",
      description: "Certify or remove certification from supplier profiles.",
      noCategory: "No category",
      productCount: (count: number) => `${count} catalog product${count > 1 ? "s" : ""}`,
    };
  }

  return {
    title: "Fournisseurs grossistes",
    description: "Certifie ou retire la certification des profils fournisseurs.",
    noCategory: "Aucune categorie",
    productCount: (count: number) => `${count} produit${count > 1 ? "s" : ""} au catalogue`,
  };
}

function getAdminStoreCopy(language: "fr" | "en") {
  if (language === "en") {
    return {
      title: "Stores",
      description: "Certify or remove certification from seller stores.",
      certifiedBadge: "Certified store",
      noStores: "No store has been created yet.",
    };
  }

  return {
    title: "Boutiques",
    description: "Certifie ou retire la certification des boutiques vendeur.",
    certifiedBadge: "Boutique certifiee",
    noStores: "Aucune boutique creee pour le moment.",
  };
}

function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCertificationAmount(durationMonths: number) {
  return durationMonths * 1500;
}

function formatDurationOption(
  durationMonths: number,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
) {
  const key = durationMonths === 1 ? "admin.durationOne" : "admin.durationMany";

  return t(key, {
    count: durationMonths,
    price: formatPrice(getCertificationAmount(durationMonths)),
  });
}

function formatCertificationDate(
  date: string | undefined,
  language: "fr" | "en",
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
) {
  if (!date) {
    return t("admin.notDefined");
  }

  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getCertificationStatus(
  product: Product,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
) {
  if (product.isCertified) {
    return t("admin.statusActive");
  }

  if (product.certificationExpiresAt && new Date(product.certificationExpiresAt).getTime() <= Date.now()) {
    return t("admin.statusExpired");
  }

  return t("admin.statusUncertified");
}

function getStoreCertificationStatus(
  store: ShopfyStore,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
) {
  if (store.isCertified) {
    return t("admin.storeStatusActive");
  }

  if (store.certificationExpiresAt && new Date(store.certificationExpiresAt).getTime() <= Date.now()) {
    return t("admin.statusExpired");
  }

  return t("admin.storeStatusUncertified");
}

function getCertificationMessageKey(isCertified: boolean, durationMonths: number): TranslationKey {
  if (!isCertified) {
    return "admin.certificationRemoved";
  }

  return durationMonths === 1 ? "admin.certifiedForOneMonth" : "admin.certifiedForMonths";
}

function getStoreCertificationMessageKey(isCertified: boolean, durationMonths: number): TranslationKey {
  if (!isCertified) {
    return "admin.certificationRemoved";
  }

  return durationMonths === 1 ? "admin.storeCertifiedForOneMonth" : "admin.storeCertifiedForMonths";
}

function getAdminMessageKey(message: string | undefined, fallback: TranslationKey): TranslationKey {
  switch (message) {
    case "Admin access denied.":
    case "Acces admin refuse.":
      return "admin.accessDenied";
    case "Incomplete request.":
    case "Requete incomplete.":
      return "admin.incompleteRequest";
    case "Certification failed.":
    case "Certification impossible.":
      return "admin.certificationImpossible";
    case "Missing server configuration.":
    case "Configuration serveur manquante.":
      return "admin.serverMissing";
    case "Certification updated, but the date columns are missing in Supabase.":
    case "Certification mise a jour, mais les colonnes de dates manquent dans Supabase.":
      return "admin.updatedMissingColumns";
    default:
      return fallback;
  }
}
