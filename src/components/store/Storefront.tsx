"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatStoreMoney } from "@/lib/demoStores";
import { useLanguage } from "@/lib/language";
import { createWhatsappUrl } from "@/lib/whatsapp";
import { createPaidStoreOrder, createPendingStoreOrder } from "@/services/storeService";
import type { ShopfyStore, StoreProduct } from "@/types/storefront";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { StoreProductImage } from "./StoreProductImage";

type StorefrontProps = {
  store: ShopfyStore;
};

type CartLine = {
  product: StoreProduct;
  quantity: number;
};

const isOnlinePaymentEnabled = process.env.NEXT_PUBLIC_ENABLE_MONEROO_PAYMENTS === "true";

export function Storefront({ store }: StorefrontProps) {
  const { language } = useLanguage();
  const copy = getStorefrontCopy(language);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [cartMessage, setCartMessage] = useState("");
  const [cartErrorMessage, setCartErrorMessage] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const allProducts = store.products;
  const cartTotal = cartLines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0);

  function addToCart(product: StoreProduct) {
    setCartMessage("");
    setCartErrorMessage("");
    setCartLines((currentLines) => {
      const existingLine = currentLines.find((line) => line.product.id === product.id);

      if (existingLine) {
        return currentLines.map((line) => (
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        ));
      }

      return [{ product, quantity: 1 }, ...currentLines];
    });
  }

  function increaseCartLine(productId: string) {
    setCartMessage("");
    setCartErrorMessage("");
    setCartLines((currentLines) => (
      currentLines.map((line) => (
        line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line
      ))
    ));
  }

  function decreaseCartLine(productId: string) {
    setCartMessage("");
    setCartErrorMessage("");
    setCartLines((currentLines) => (
      currentLines.flatMap((line) => {
        if (line.product.id !== productId) {
          return [line];
        }

        if (line.quantity <= 1) {
          return [];
        }

        return [{ ...line, quantity: line.quantity - 1 }];
      })
    ));
  }

  function removeCartLine(productId: string) {
    setCartMessage("");
    setCartErrorMessage("");
    setCartLines((currentLines) => currentLines.filter((line) => line.product.id !== productId));
  }

  async function handleWhatsappOrder() {
    setCartMessage("");
    setCartErrorMessage("");

    if (cartLines.length === 0) {
      return;
    }

    if (!store.whatsappPhone) {
      setCartErrorMessage(copy.whatsappMissing);
      return;
    }

    setIsCreatingOrder(true);

    const whatsappWindow = window.open("about:blank", "_blank");

    try {
      const order = await createPendingStoreOrder(
        store.slug,
        cartLines.map((line) => ({
          productSlug: line.product.slug,
          quantity: line.quantity,
        })),
        {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
      );
      const whatsappOrderUrl = createWhatsappUrl(
        store.whatsappPhone,
        buildWhatsappOrderMessage(store, cartLines, cartTotal, copy, order.id),
      );

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappOrderUrl;
      } else {
        window.open(whatsappOrderUrl, "_blank", "noopener,noreferrer");
      }

      setCartLines([]);
      setCartMessage(copy.pendingOrderCreated);
    } catch (error) {
      whatsappWindow?.close();
      setCartErrorMessage(error instanceof Error ? error.message : copy.pendingOrderError);
    } finally {
      setIsCreatingOrder(false);
    }
  }

  async function handleOnlinePayment() {
    setCartMessage("");
    setCartErrorMessage("");

    if (cartLines.length === 0) {
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setCartErrorMessage(copy.customerRequired);
      return;
    }

    setIsCreatingOrder(true);

    const paymentWindow = window.open("about:blank", "_blank");

    try {
      const { paymentUrl } = await createPaidStoreOrder(
        store.slug,
        cartLines.map((line) => ({
          productSlug: line.product.slug,
          quantity: line.quantity,
        })),
        {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
      );

      if (paymentWindow) {
        paymentWindow.location.href = paymentUrl;
      } else {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }

      setCartLines([]);
      setCartMessage(copy.paymentStarted);
    } catch (error) {
      paymentWindow?.close();
      setCartErrorMessage(error instanceof Error ? error.message : copy.paymentError);
    } finally {
      setIsCreatingOrder(false);
    }
  }

  if (store.requiresCertification) {
    return (
      <div className="bg-gray-50 transition-colors dark:bg-gray-950">
        <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
          <div className="relative min-h-[300px] overflow-hidden rounded-lg bg-gray-950">
            <Image
              src={store.bannerUrl}
              alt={store.name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-end">
              <div className="grid max-w-3xl gap-3 p-5 sm:p-8">
                <p className="text-xs font-black uppercase tracking-wide text-orange-200">{copy.inactiveKicker}</p>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{store.name}</h1>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/90 sm:text-lg">
                  {copy.inactiveDescription}
                </p>
                <Link
                  href="/dashboard"
                  className="mt-2 inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
                >
                  {copy.ownerDashboard}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 transition-colors dark:bg-gray-950">
      <section className="bg-white dark:bg-gray-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
          <div className="relative min-h-[320px] overflow-hidden rounded-lg bg-gray-950">
            <Image
              src={store.bannerUrl}
              alt={store.name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 flex items-end">
              <div className="grid max-w-3xl gap-4 p-5 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/40 bg-white">
                    <Image src={store.logoUrl} alt={`${store.name} logo`} fill sizes="64px" className="object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-orange-200">{store.city}, {store.country}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{store.name}</h1>
                      {store.isCertified ? (
                        <CertifiedBadge label={copy.certifiedBadge} className="border-white/30 bg-white/95 text-gray-950" />
                      ) : null}
                    </div>
                  </div>
                </div>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/90 sm:text-lg">{store.description}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <StoreMetric label={copy.products} value={String(allProducts.length)} />
            <StoreMetric label={copy.cart} value={`${cartCount} ${copy.items}`} />
          </div>

          {!store.isCertified && store.isTrialActive ? (
            <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm font-bold text-orange-800 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-100">
              {copy.trialBanner} {store.trialDaysRemaining || 0} {copy.daysRemaining}.
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.catalogKicker}</p>
              <h2 className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{copy.catalogTitle}</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {allProducts.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                copy={copy}
                onAddToCart={() => addToCart(product)}
              />
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:sticky lg:top-20">
          <h2 className="text-lg font-black text-gray-950 dark:text-white">{copy.cartTitle}</h2>
          {cartLines.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-300">{copy.emptyCart}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {cartLines.map((line) => (
                <div key={line.product.id} className="grid gap-3 border-b border-gray-100 pb-3 text-sm dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-black text-gray-950 dark:text-white">{line.product.title}</p>
                      <p className="mt-1 text-gray-500 dark:text-gray-300">{formatStoreMoney(line.product.price, line.product.currency)}</p>
                    </div>
                    <p className="shrink-0 font-black text-gray-950 dark:text-white">
                      {formatStoreMoney(line.product.price * line.quantity, line.product.currency)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-grid grid-cols-[36px_48px_36px] overflow-hidden rounded-md border border-gray-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => decreaseCartLine(line.product.id)}
                        aria-label={`${copy.decreaseQuantity} ${line.product.title}`}
                        className="min-h-9 bg-white text-sm font-black text-gray-900 transition hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:hover:bg-white/10"
                      >
                        -
                      </button>
                      <span className="grid min-h-9 place-items-center border-x border-gray-200 text-sm font-black text-gray-950 dark:border-white/10 dark:text-white">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseCartLine(line.product.id)}
                        aria-label={`${copy.increaseQuantity} ${line.product.title}`}
                        className="min-h-9 bg-white text-sm font-black text-gray-900 transition hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:hover:bg-white/10"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartLine(line.product.id)}
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-gray-200 px-3 text-xs font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:text-gray-100"
                    >
                      {copy.removeFromCart}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-base font-black text-gray-950 dark:text-white">
                <span>{copy.total}</span>
                <span>{formatStoreMoney(cartTotal, store.currency)}</span>
              </div>
              {isOnlinePaymentEnabled ? (
                <>
                  <div className="grid gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      {copy.customerInfo}
                    </p>
                    <label className="grid gap-1">
                      <span className="text-xs font-black text-gray-600 dark:text-gray-300">{copy.customerName}</span>
                      <input
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        suppressHydrationWarning
                        className="min-h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black text-gray-600 dark:text-gray-300">{copy.customerPhone}</span>
                      <input
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        suppressHydrationWarning
                        inputMode="tel"
                        className="min-h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black text-gray-600 dark:text-gray-300">{copy.customerEmail}</span>
                      <input
                        value={customerEmail}
                        onChange={(event) => setCustomerEmail(event.target.value)}
                        suppressHydrationWarning
                        inputMode="email"
                        className="min-h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleOnlinePayment}
                    disabled={isCreatingOrder}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingOrder ? copy.creatingPendingOrder : copy.payOnline}
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsappOrder}
                    disabled={isCreatingOrder}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-green-200 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-100"
                  >
                    {copy.whatsappOrder}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleWhatsappOrder}
                  disabled={isCreatingOrder}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingOrder ? copy.creatingPendingOrder : copy.whatsappOrder}
                </button>
              )}
              {cartMessage ? (
                <p className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200">
                  {cartMessage}
                </p>
              ) : null}
              {cartErrorMessage ? (
                <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                  {cartErrorMessage}
                </p>
              ) : null}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function StoreProductCard({
  product,
  copy,
  onAddToCart,
}: {
  product: StoreProduct;
  copy: ReturnType<typeof getStorefrontCopy>;
  onAddToCart: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-950">
        <StoreProductImage src={product.image} alt={product.title} sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="grid gap-3 p-4">
        <div>
          <p className="text-xs font-black uppercase text-orange-500">{product.category}</p>
          <h3 className="mt-1 break-words text-lg font-black text-gray-950 dark:text-white">{product.title}</h3>
          <p className="mt-2 break-words text-sm leading-6 text-gray-600 dark:text-gray-300">{product.description}</p>
        </div>
        {product.sourceSupplierName ? (
          <p className="break-words text-xs font-bold text-gray-500 dark:text-gray-400">
            {copy.source}: {product.sourceSupplierName}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-black text-gray-950 dark:text-white">{formatStoreMoney(product.price, product.currency)}</p>
            {product.compareAtPrice ? (
              <p className="text-xs font-bold text-gray-400 line-through">{formatStoreMoney(product.compareAtPrice, product.currency)}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onAddToCart}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}

function StoreMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-gray-900">
      <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function buildWhatsappOrderMessage(
  store: ShopfyStore,
  cartLines: CartLine[],
  total: number,
  copy: ReturnType<typeof getStorefrontCopy>,
  orderId?: string,
) {
  const items = cartLines
    .map((line) => `- ${line.product.title} x${line.quantity}: ${formatStoreMoney(line.product.price * line.quantity, line.product.currency)}`)
    .join("\n");
  const orderReference = orderId ? `\n${copy.orderReference}: ${orderId.slice(0, 8)}` : "";

  return `${copy.whatsappMessageIntro} ${store.name}${orderReference}\n\n${items}\n\n${copy.total}: ${formatStoreMoney(total, store.currency)}`;
}

function getStorefrontCopy(language: string) {
  if (language === "fr") {
    return {
      products: "Produits",
      certifiedBadge: "Boutique certifiee",
      inactiveKicker: "Activation requise",
      inactiveDescription: "Cette boutique a termine ses 7 jours gratuits. Le proprietaire doit l'activer/certifier pour rouvrir le catalogue.",
      ownerDashboard: "Acceder au dashboard",
      trialBanner: "Essai gratuit actif. Activation/certification requise dans",
      daysRemaining: "jour(s)",
      cart: "Panier",
      items: "article(s)",
      catalogKicker: "Boutique",
      catalogTitle: "Catalogue",
      addToCart: "Ajouter",
      decreaseQuantity: "Reduire la quantite de",
      increaseQuantity: "Augmenter la quantite de",
      removeFromCart: "Retirer",
      source: "Source",
      cartTitle: "Panier",
      emptyCart: "Aucun article dans le panier.",
      total: "Total",
      customerInfo: "Informations client",
      customerName: "Nom",
      customerPhone: "Telephone",
      customerEmail: "Email",
      customerRequired: "Entrez votre nom, telephone et email avant de payer.",
      payOnline: "Payer en ligne",
      paymentStarted: "Lien de paiement ouvert. La commande sera marquee payee apres confirmation Moneroo.",
      paymentError: "Impossible de demarrer le paiement en ligne.",
      whatsappOrder: "Commander sur WhatsApp",
      creatingPendingOrder: "Creation commande...",
      pendingOrderCreated: "Commande en attente creee. Le vendeur devra la confirmer dans son dashboard.",
      pendingOrderError: "Impossible de creer la commande en attente.",
      whatsappMissing: "Cette boutique n'a pas encore de numero WhatsApp.",
      whatsappMessageIntro: "Bonjour, je veux commander dans la boutique",
      orderReference: "Commande",
    };
  }

  return {
    products: "Products",
    certifiedBadge: "Certified store",
    inactiveKicker: "Activation required",
    inactiveDescription: "This store has used its 7-day free trial. The owner must activate/certify it to reopen the catalog.",
    ownerDashboard: "Go to dashboard",
    trialBanner: "Free trial active. Activation/certification required in",
    daysRemaining: "day(s)",
    cart: "Cart",
    items: "item(s)",
    catalogKicker: "Store",
    catalogTitle: "Catalog",
    addToCart: "Add",
    decreaseQuantity: "Decrease quantity for",
    increaseQuantity: "Increase quantity for",
    removeFromCart: "Remove",
    source: "Source",
    cartTitle: "Cart",
    emptyCart: "No item in the cart.",
    total: "Total",
    customerInfo: "Customer information",
    customerName: "Name",
    customerPhone: "Phone",
    customerEmail: "Email",
    customerRequired: "Enter your name, phone, and email before paying.",
    payOnline: "Pay online",
    paymentStarted: "Payment link opened. The order will be marked paid after Moneroo confirmation.",
    paymentError: "Unable to start online payment.",
    whatsappOrder: "Order on WhatsApp",
    creatingPendingOrder: "Creating order...",
    pendingOrderCreated: "Pending order created. The seller must confirm it in their dashboard.",
    pendingOrderError: "Unable to create the pending order.",
    whatsappMissing: "This store does not have a WhatsApp number yet.",
    whatsappMessageIntro: "Hello, I want to order from",
    orderReference: "Order",
  };
}
