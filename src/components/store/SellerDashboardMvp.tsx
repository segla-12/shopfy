"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createStoreSlug } from "@/lib/createdStores";
import { formatStoreMoney } from "@/lib/demoStores";
import { useLanguage } from "@/lib/language";
import {
  addManualSupabaseStoreProduct,
  createStoreCertificationPayment,
  deleteSupabaseStoreProduct,
  getMySupabaseStoreOrders,
  getMySupabaseStores,
  updateSupabaseStoreOrderStatus,
} from "@/services/storeService";
import type { ShopfyStore, StoreOrder, StoreProduct } from "@/types/storefront";
import { StoreProductImage } from "./StoreProductImage";

type DashboardStatus = "checking" | "unauthenticated" | "missing-store" | "ready";

const CERTIFICATION_PRICE_PER_MONTH = 1500;
const certificationDurationOptions = [1, 2, 3, 6, 12];

type ManualProductValues = {
  title: string;
  description: string;
  category: string;
  price: string;
  compareAtPrice: string;
  inventoryQuantity: string;
};

const initialManualProductValues: ManualProductValues = {
  title: "",
  description: "",
  category: "General",
  price: "",
  compareAtPrice: "",
  inventoryQuantity: "1",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToDataUrl(file: File, maxSize = 1000): Promise<string> {
  const source = await readFileAsDataUrl(file);

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return source;
  }

  return new Promise((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(source);
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };

    image.onerror = () => resolve(source);
    image.src = source;
  });
}

export function SellerDashboardMvp() {
  const { language } = useLanguage();
  const copy = getDashboardCopy(language);
  const [activeStore, setActiveStore] = useState<ShopfyStore | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [sellerStoreMessage, setSellerStoreMessage] = useState("");
  const [hasSellerStore, setHasSellerStore] = useState(false);
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatus>("checking");
  const [manualProductImage, setManualProductImage] = useState("");
  const [manualProductValues, setManualProductValues] = useState<ManualProductValues>(initialManualProductValues);
  const [manualProductMessage, setManualProductMessage] = useState("");
  const [isSavingManualProduct, setIsSavingManualProduct] = useState(false);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [certificationDurationMonths, setCertificationDurationMonths] = useState(1);
  const [certificationMessage, setCertificationMessage] = useState("");
  const [isStartingCertification, setIsStartingCertification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allProducts = activeStore?.products || [];
  const pendingOrders = useMemo(
    () => storeOrders.filter((order) => order.status === "pending"),
    [storeOrders],
  );
  const confirmedOrders = useMemo(
    () => storeOrders.filter((order) => order.status === "confirmed"),
    [storeOrders],
  );
  const confirmedRevenue = confirmedOrders.reduce((total, order) => total + order.totalAmount, 0);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      async function loadDashboard() {
        try {
          const stores = await getMySupabaseStores();
          const sellerStore = stores[0];

          setHasSellerStore(Boolean(sellerStore));
          setActiveStore(sellerStore || null);
          setSellerStoreMessage(sellerStore ? "" : getDashboardCopy(language).noStore);
          setDashboardStatus(sellerStore ? "ready" : "missing-store");

          if (!sellerStore) {
            setStoreOrders([]);
            return;
          }

          setStoreOrders(await getMySupabaseStoreOrders(sellerStore.slug));
        } catch (error) {
          setHasSellerStore(false);
          setActiveStore(null);
          setStoreOrders([]);
          setSellerStoreMessage(error instanceof Error ? error.message : getDashboardCopy(language).authRequired);
          setDashboardStatus("unauthenticated");
        }
      }

      loadDashboard();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [language]);

  function openProductGallery() {
    setErrorMessage("");
    setManualProductMessage("");

    if (activeStore?.requiresCertification) {
      setErrorMessage(copy.certificationRequiredAction);
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleManualProductImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(copy.imageRequired);
      return;
    }

    try {
      const image = await fileToDataUrl(file);
      setManualProductImage(image);
    } catch {
      setErrorMessage(copy.imageRequired);
    }
  }

  function updateManualProductValue(field: keyof ManualProductValues, value: string) {
    setManualProductValues((currentValues) => ({ ...currentValues, [field]: value }));
  }

  function resetManualProductForm() {
    setManualProductImage("");
    setManualProductValues(initialManualProductValues);
    setIsSavingManualProduct(false);
  }

  async function saveManualProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setManualProductMessage("");

    if (!hasSellerStore || !activeStore) {
      setErrorMessage(copy.noStore);
      return;
    }

    if (activeStore.requiresCertification) {
      setErrorMessage(copy.certificationRequiredAction);
      return;
    }

    if (!manualProductImage) {
      setErrorMessage(copy.imageRequired);
      return;
    }

    const price = Number(manualProductValues.price);
    const compareAtPrice = Number(manualProductValues.compareAtPrice);
    const inventoryQuantity = Number(manualProductValues.inventoryQuantity);
    const slug = createStoreSlug(manualProductValues.title);

    if (!slug || !manualProductValues.title.trim() || !Number.isFinite(price) || price <= 0) {
      setErrorMessage(copy.manualProductRequired);
      return;
    }

    const product: StoreProduct = {
      id: `manual-${Date.now()}`,
      slug,
      title: manualProductValues.title.trim(),
      description: manualProductValues.description.trim(),
      category: manualProductValues.category.trim() || "General",
      image: manualProductImage,
      price,
      compareAtPrice: Number.isFinite(compareAtPrice) && compareAtPrice > 0 ? compareAtPrice : undefined,
      currency: activeStore.currency,
      inventoryQuantity: Number.isFinite(inventoryQuantity) ? Math.max(0, Math.trunc(inventoryQuantity)) : 0,
    };

    setIsSavingManualProduct(true);

    try {
      await addManualSupabaseStoreProduct(activeStore.slug, product);
      const stores = await getMySupabaseStores();
      setActiveStore(stores.find((item) => item.slug === activeStore.slug) || stores[0] || activeStore);
      setManualProductMessage(copy.manualProductSaved);
      resetManualProductForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.manualProductError);
      setIsSavingManualProduct(false);
    }
  }

  async function removeProduct(productId: string) {
    setErrorMessage("");

    if (!hasSellerStore || !activeStore) {
      setErrorMessage(copy.noStore);
      return;
    }

    try {
      await deleteSupabaseStoreProduct(activeStore.slug, productId);
      const stores = await getMySupabaseStores();
      setActiveStore(stores.find((item) => item.slug === activeStore.slug) || activeStore);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.removeError);
    }
  }

  async function confirmOrder(orderId: string) {
    if (!activeStore) {
      setErrorMessage(copy.noStore);
      return;
    }

    if (activeStore.requiresCertification) {
      setErrorMessage(copy.certificationRequiredAction);
      return;
    }

    setErrorMessage("");
    setOrderMessage("");
    setUpdatingOrderId(orderId);

    try {
      await updateSupabaseStoreOrderStatus(activeStore.slug, orderId, "confirmed");
      setStoreOrders(await getMySupabaseStoreOrders(activeStore.slug));
      setOrderMessage(copy.orderConfirmed);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.orderUpdateError);
    } finally {
      setUpdatingOrderId("");
    }
  }

  async function startCertificationPayment() {
    if (!activeStore) {
      setErrorMessage(copy.noStore);
      return;
    }

    setErrorMessage("");
    setCertificationMessage("");
    setIsStartingCertification(true);

    const paymentWindow = window.open("about:blank", "_blank");

    try {
      const { paymentUrl } = await createStoreCertificationPayment(activeStore.slug, certificationDurationMonths);

      if (paymentWindow) {
        paymentWindow.location.href = paymentUrl;
      } else {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }

      setCertificationMessage(copy.certificationPaymentStarted);
    } catch (error) {
      paymentWindow?.close();
      setErrorMessage(error instanceof Error ? error.message : copy.certificationPaymentError);
    } finally {
      setIsStartingCertification(false);
    }
  }

  if (dashboardStatus === "checking") {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-300">{copy.authChecking}</p>
        </div>
      </section>
    );
  }

  if (dashboardStatus === "unauthenticated") {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm dark:border-orange-400/20 dark:bg-gray-900">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.authKicker}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.authTitle}</h1>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
            {sellerStoreMessage || copy.authRequired}
          </p>
          <Link
            href="/auth?next=/dashboard"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.authLink}
          </Link>
        </div>
      </section>
    );
  }

  if (dashboardStatus === "missing-store" || !activeStore) {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm dark:border-orange-400/20 dark:bg-gray-900">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.noStoreKicker}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.noStoreTitle}</h1>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">{copy.noStore}</p>
          <Link
            href="/create-store"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.createStore}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-5xl dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
            {activeStore.name} - https://shopfy.site/store/{activeStore.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/store/${activeStore.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-gray-950 px-5 text-sm font-black text-white transition hover:bg-orange-500 dark:bg-white dark:text-gray-950 dark:hover:bg-orange-300"
          >
            {copy.viewStore}
          </Link>
          <button
            type="button"
            onClick={openProductGallery}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
          >
            {copy.addManualProduct}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleManualProductImageChange}
          />
        </div>
      </div>

      <CertificationPanel
        store={activeStore}
        copy={copy}
        language={language}
        durationMonths={certificationDurationMonths}
        message={certificationMessage}
        isStarting={isStartingCertification}
        onDurationChange={setCertificationDurationMonths}
        onStartPayment={startCertificationPayment}
      />

      {manualProductImage ? (
        <form onSubmit={saveManualProduct} className="grid gap-4 rounded-lg border border-orange-100 bg-white p-4 shadow-sm dark:border-orange-400/20 dark:bg-gray-900 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-950">
            <div className="relative h-56 md:h-full">
              <Image
                src={manualProductImage}
                alt={copy.manualProductPreviewAlt}
                fill
                unoptimized
                sizes="220px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="grid gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-orange-500">{copy.manualProductKicker}</p>
              <h2 className="mt-1 text-xl font-black text-gray-950 dark:text-white">{copy.manualProductTitle}</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.productTitle}</span>
                <input
                  value={manualProductValues.title}
                  onChange={(event) => updateManualProductValue("title", event.target.value)}
                  required
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.productCategory}</span>
                <input
                  value={manualProductValues.category}
                  onChange={(event) => updateManualProductValue("category", event.target.value)}
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.productPrice}</span>
                <input
                  type="number"
                  min="1"
                  value={manualProductValues.price}
                  onChange={(event) => updateManualProductValue("price", event.target.value)}
                  required
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.productInventory}</span>
                <input
                  type="number"
                  min="0"
                  value={manualProductValues.inventoryQuantity}
                  onChange={(event) => updateManualProductValue("inventoryQuantity", event.target.value)}
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-black text-gray-950 dark:text-white">{copy.productDescription}</span>
              <textarea
                value={manualProductValues.description}
                onChange={(event) => updateManualProductValue("description", event.target.value)}
                rows={3}
                className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSavingManualProduct}
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingManualProduct ? copy.savingProduct : copy.saveProduct}
              </button>
              <button
                type="button"
                onClick={resetManualProductForm}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
              >
                {copy.cancel}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {manualProductMessage ? (
        <p className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200">
          {manualProductMessage}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <DashboardMetric label={copy.products} value={String(allProducts.length)} />
        <DashboardMetric label={copy.pendingOrdersMetric} value={String(pendingOrders.length)} />
        <DashboardMetric label={copy.confirmedOrdersMetric} value={String(confirmedOrders.length)} />
        <DashboardMetric label={copy.revenue} value={formatStoreMoney(confirmedRevenue, activeStore.currency)} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-gray-950 dark:text-white">{copy.pendingOrders}</h2>
          <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-black text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
            {pendingOrders.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {orderMessage ? (
            <p className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200">
              {orderMessage}
            </p>
          ) : null}
          {pendingOrders.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 p-4 text-sm font-bold text-gray-500 dark:border-white/10 dark:text-gray-300">
              {copy.noPendingOrders}
            </p>
          ) : (
            pendingOrders.map((order) => (
              <article key={order.id} className="grid gap-3 rounded-md border border-gray-100 p-3 dark:border-white/10 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-gray-950 dark:text-white">
                      {copy.orderReference} {order.id.slice(0, 8)}
                    </p>
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
                      {new Date(order.createdAt).toLocaleString(language === "fr" ? "fr-FR" : "en-US")}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-xs font-black ${getPaymentBadgeClass(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order.paymentStatus, copy)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-black text-gray-950 dark:text-white">
                    {copy.orderTotal}: {formatStoreMoney(order.totalAmount, order.currency)}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm text-gray-600 dark:text-gray-300">
                    {order.items.map((item) => (
                      <p key={item.id} className="break-words">
                        {item.title} x{item.quantity} - {formatStoreMoney(item.totalPrice, item.currency)}
                      </p>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => confirmOrder(order.id)}
                  disabled={updatingOrderId === order.id || isWaitingForOnlinePayment(order)}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWaitingForOnlinePayment(order)
                    ? copy.awaitingPayment
                    : updatingOrderId === order.id
                      ? copy.confirmingOrder
                      : copy.confirmOrder}
                </button>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-gray-950 dark:text-white">{copy.storeProducts}</h2>
            <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-black text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
              {allProducts.length}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {errorMessage ? (
              <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                {errorMessage}
              </p>
            ) : null}
            {allProducts.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-200 p-4 text-sm font-bold text-gray-500 dark:border-white/10 dark:text-gray-300">
                {copy.noProducts}
              </p>
            ) : (
              allProducts.map((product) => (
                <div key={product.id} className="grid gap-3 rounded-md border border-gray-100 p-3 dark:border-white/10 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
                  <div className="relative h-24 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-950 sm:h-20">
                    <StoreProductImage src={product.image} alt={product.title} sizes="88px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-black text-gray-950 dark:text-white">{product.title}</p>
                    <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-300">
                      {product.sourceSupplierName || copy.manualProduct} - {formatStoreMoney(product.price, product.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-gray-200 px-3 text-sm font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:text-gray-100"
                  >
                    {copy.remove}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="grid h-fit gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <h2 className="text-xl font-black text-gray-950 dark:text-white">{copy.payments}</h2>
          <PaymentRow label="Moneroo" status={copy.onlinePayments} />
          <PaymentRow label="WhatsApp" status={copy.available} />
          <PaymentRow label={copy.manualPayments} status={copy.available} />
        </aside>
      </div>
    </section>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function CertificationPanel({
  store,
  copy,
  language,
  durationMonths,
  message,
  isStarting,
  onDurationChange,
  onStartPayment,
}: {
  store: ShopfyStore;
  copy: ReturnType<typeof getDashboardCopy>;
  language: string;
  durationMonths: number;
  message: string;
  isStarting: boolean;
  onDurationChange: (durationMonths: number) => void;
  onStartPayment: () => void;
}) {
  const amount = durationMonths * CERTIFICATION_PRICE_PER_MONTH;
  const statusClass = store.requiresCertification
    ? "border-red-100 bg-red-50 dark:border-red-400/20 dark:bg-red-400/10"
    : store.isCertified
      ? "border-green-100 bg-green-50 dark:border-green-400/20 dark:bg-green-400/10"
      : "border-orange-100 bg-orange-50 dark:border-orange-400/20 dark:bg-orange-400/10";
  const statusLabel = store.isCertified
    ? copy.certificationActiveTitle
    : store.isTrialActive
      ? copy.trialActiveTitle
      : copy.trialEndedTitle;
  const statusText = getCertificationStatusText(store, copy, language);

  return (
    <section className={`grid gap-4 rounded-lg border p-4 shadow-sm ${statusClass}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-300">
            {copy.certificationKicker}
          </p>
          <h2 className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{statusLabel}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700 dark:text-gray-200">{statusText}</p>
        </div>
        <span className="w-fit rounded-md bg-white px-3 py-2 text-xs font-black text-gray-700 shadow-sm dark:bg-gray-950 dark:text-gray-200">
          {store.isCertified ? copy.certifiedStatus : store.isTrialActive ? copy.trialStatus : copy.lockedStatus}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(180px,240px)_minmax(160px,1fr)_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-black text-gray-950 dark:text-white">{copy.durationLabel}</span>
          <select
            value={durationMonths}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            className="min-h-11 rounded-md border border-gray-200 bg-white px-3 text-sm font-black text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
          >
            {certificationDurationOptions.map((duration) => (
              <option key={duration} value={duration}>
                {duration} {duration > 1 ? copy.monthsLabel : copy.monthLabel}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-md border border-white/70 bg-white px-3 py-2 dark:border-white/10 dark:bg-gray-950">
          <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">{copy.certificationAmount}</p>
          <p className="mt-1 text-xl font-black text-gray-950 dark:text-white">{formatStoreMoney(amount, "XOF")}</p>
        </div>

        <button
          type="button"
          onClick={onStartPayment}
          disabled={isStarting}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-gray-950 px-5 text-sm font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-orange-300"
        >
          {isStarting
            ? copy.startingCertification
            : store.isCertified
              ? copy.renewCertification
              : copy.startCertification}
        </button>
      </div>

      {message ? (
        <p className="rounded-md border border-green-100 bg-white p-3 text-sm font-bold text-green-700 dark:border-green-400/20 dark:bg-gray-950 dark:text-green-200">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function PaymentRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 dark:border-white/10">
      <span className="text-sm font-black text-gray-950 dark:text-white">{label}</span>
      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">{status}</span>
    </div>
  );
}

function isWaitingForOnlinePayment(order: StoreOrder) {
  return order.paymentProvider === "moneroo" && order.paymentStatus !== "paid";
}

function getPaymentStatusLabel(
  status: StoreOrder["paymentStatus"],
  copy: ReturnType<typeof getDashboardCopy>,
) {
  switch (status) {
    case "paid":
      return copy.paymentPaid;
    case "pending":
      return copy.paymentPending;
    case "failed":
      return copy.paymentFailed;
    case "cancelled":
      return copy.paymentCancelled;
    default:
      return copy.paymentManual;
  }
}

function getCertificationStatusText(
  store: ShopfyStore,
  copy: ReturnType<typeof getDashboardCopy>,
  language: string,
) {
  if (store.isCertified) {
    return `${copy.certificationActiveText} ${copy.certificationEnds}: ${formatDashboardDate(store.certificationExpiresAt, language)}.`;
  }

  if (store.isTrialActive) {
    return `${copy.trialActiveText} ${store.trialDaysRemaining || 0} ${copy.daysRemaining}. ${copy.trialEnds}: ${formatDashboardDate(store.trialEndsAt, language)}.`;
  }

  return copy.trialEndedText;
}

function formatDashboardDate(date: string | undefined, language: string) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
}

function getPaymentBadgeClass(status: StoreOrder["paymentStatus"]) {
  if (status === "paid") {
    return "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-200";
  }

  if (status === "pending") {
    return "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200";
  }

  if (status === "failed" || status === "cancelled") {
    return "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200";
  }

  return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
}

function getDashboardCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Dashboard vendeur",
      title: "Gestion de boutique",
      viewStore: "Voir la boutique",
      createStore: "Creer une boutique",
      addManualProduct: "Ajouter des produits",
      products: "Produits",
      imported: "Importes",
      orders: "Commandes",
      pendingOrdersMetric: "En attente",
      confirmedOrdersMetric: "Confirmees",
      revenue: "Ventes",
      pendingOrders: "Commandes en attente",
      noPendingOrders: "Aucune commande en attente.",
      orderReference: "Commande",
      orderTotal: "Total",
      confirmOrder: "Confirmer la vente",
      confirmingOrder: "Confirmation...",
      awaitingPayment: "En attente paiement",
      orderConfirmed: "Commande confirmee. La vente est maintenant comptabilisee.",
      orderUpdateError: "Impossible de confirmer cette commande.",
      storeProducts: "Produits de la boutique",
      noProducts: "Aucun produit pour le moment.",
      manualProduct: "Produit ajoute manuellement",
      remove: "Retirer",
      payments: "Paiements",
      onlinePayments: "Paiement en ligne",
      notConnected: "Non connecte",
      manualPayments: "Paiements manuels",
      available: "Disponible",
      paymentPaid: "Paiement recu",
      paymentPending: "Paiement en attente",
      paymentFailed: "Paiement echoue",
      paymentCancelled: "Paiement annule",
      paymentManual: "Paiement manuel",
      certificationKicker: "Activation boutique",
      certificationActiveTitle: "Boutique active et certifiee",
      certificationActiveText: "Votre boutique est active.",
      trialActiveTitle: "Essai gratuit actif",
      trialActiveText: "Votre boutique est utilisable gratuitement.",
      trialEndedTitle: "Activation requise",
      trialEndedText: "Votre essai gratuit de 7 jours est termine. Activez/certifiez votre boutique pour continuer a vendre.",
      certificationEnds: "Expiration",
      trialEnds: "Fin de l'essai",
      daysRemaining: "jour(s) restant(s)",
      durationLabel: "Duree de certification",
      monthLabel: "mois",
      monthsLabel: "mois",
      certificationAmount: "Montant a payer",
      startCertification: "Activer / certifier",
      renewCertification: "Prolonger",
      startingCertification: "Ouverture paiement...",
      certificationPaymentStarted: "Paiement Moneroo ouvert. La boutique sera activee apres confirmation du paiement.",
      certificationPaymentError: "Impossible de demarrer le paiement de certification.",
      certificationRequiredAction: "Essai gratuit termine. Activez/certifiez la boutique pour continuer.",
      certifiedStatus: "Certifiee",
      trialStatus: "Essai gratuit",
      lockedStatus: "Bloquee",
      removeError: "Impossible de retirer le produit dans Supabase.",
      authRequired: "Connectez-vous avec votre compte vendeur pour voir votre dashboard securise.",
      authChecking: "Verification du compte vendeur...",
      authKicker: "Acces securise",
      authTitle: "Connectez-vous pour acceder au dashboard",
      authLink: "Se connecter",
      noStoreKicker: "Boutique requise",
      noStoreTitle: "Aucune boutique vendeur associee",
      noStore: "Ce dashboard s'active uniquement pour le proprietaire d'une boutique connecte a son compte.",
      imageRequired: "Selectionnez une photo produit depuis votre appareil.",
      manualProductKicker: "Produit manuel",
      manualProductTitle: "Ajouter un produit a votre boutique",
      manualProductPreviewAlt: "Apercu du produit",
      productTitle: "Nom du produit",
      productCategory: "Categorie",
      productPrice: "Prix",
      productInventory: "Stock",
      productDescription: "Description",
      manualProductRequired: "Le nom du produit, la photo et un prix valide sont obligatoires.",
      manualProductSaved: "Produit ajoute a votre boutique.",
      manualProductError: "Impossible d'ajouter ce produit.",
      saveProduct: "Enregistrer le produit",
      savingProduct: "Enregistrement...",
      cancel: "Annuler",
    };
  }

  return {
    kicker: "Seller dashboard",
    title: "Store management",
    viewStore: "View store",
    createStore: "Create a store",
    addManualProduct: "Add products",
    products: "Products",
    imported: "Imported",
    orders: "Orders",
    pendingOrdersMetric: "Pending",
    confirmedOrdersMetric: "Confirmed",
    revenue: "Sales",
    pendingOrders: "Pending orders",
    noPendingOrders: "No pending order.",
    orderReference: "Order",
    orderTotal: "Total",
    confirmOrder: "Confirm sale",
    confirmingOrder: "Confirming...",
    awaitingPayment: "Awaiting payment",
    orderConfirmed: "Order confirmed. The sale is now counted.",
    orderUpdateError: "Unable to confirm this order.",
    storeProducts: "Store products",
    noProducts: "No product yet.",
    manualProduct: "Manually added product",
    remove: "Remove",
    payments: "Payments",
    onlinePayments: "Online payments",
    notConnected: "Not connected",
    manualPayments: "Manual payments",
    available: "Available",
    paymentPaid: "Payment received",
    paymentPending: "Payment pending",
    paymentFailed: "Payment failed",
    paymentCancelled: "Payment cancelled",
    paymentManual: "Manual payment",
    certificationKicker: "Store activation",
    certificationActiveTitle: "Store active and certified",
    certificationActiveText: "Your store is active.",
    trialActiveTitle: "Free trial active",
    trialActiveText: "Your store can be used for free.",
    trialEndedTitle: "Activation required",
    trialEndedText: "Your 7-day free trial has ended. Activate/certify your store to keep selling.",
    certificationEnds: "Expires",
    trialEnds: "Trial ends",
    daysRemaining: "day(s) remaining",
    durationLabel: "Certification duration",
    monthLabel: "month",
    monthsLabel: "months",
    certificationAmount: "Amount due",
    startCertification: "Activate / certify",
    renewCertification: "Extend",
    startingCertification: "Opening payment...",
    certificationPaymentStarted: "Moneroo payment opened. The store will be activated after payment confirmation.",
    certificationPaymentError: "Unable to start certification payment.",
    certificationRequiredAction: "Free trial ended. Activate/certify the store to continue.",
    certifiedStatus: "Certified",
    trialStatus: "Free trial",
    lockedStatus: "Locked",
    removeError: "Unable to remove the product in Supabase.",
    authRequired: "Sign in with your seller account to view your secured dashboard.",
    authChecking: "Checking seller account...",
    authKicker: "Secured access",
    authTitle: "Sign in to access the dashboard",
    authLink: "Sign in",
    noStoreKicker: "Store required",
    noStoreTitle: "No seller store attached",
    noStore: "This dashboard is available only to a signed-in store owner.",
    imageRequired: "Select a product photo from your device.",
    manualProductKicker: "Manual product",
    manualProductTitle: "Add a product to your store",
    manualProductPreviewAlt: "Product preview",
    productTitle: "Product name",
    productCategory: "Category",
    productPrice: "Price",
    productInventory: "Stock",
    productDescription: "Description",
    manualProductRequired: "Product name, photo, and a valid price are required.",
    manualProductSaved: "Product added to your store.",
    manualProductError: "Unable to add this product.",
    saveProduct: "Save product",
    savingProduct: "Saving...",
    cancel: "Cancel",
  };
}
