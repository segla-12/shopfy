"use client";

import Image from "next/image";
import { useState } from "react";
import { formatStoreMoney } from "@/lib/demoStores";
import { useLanguage } from "@/lib/language";
import { StoreCartProvider, useStoreCart, type StoreCartLine } from "@/lib/storeCart";
import { buildWhatsAppLink, isValidWhatsappPhone } from "@/lib/whatsapp";
import { useNavbarMode } from "@/lib/navbarMode";
import { createPendingStoreOrder } from "@/services/storeService";
import type { ShopfyStore, StoreProduct } from "@/types/storefront";
import { StoreProductImage } from "./StoreProductImage";

type StorefrontProps = {
  store: ShopfyStore;
};

// Online payments removed; use WhatsApp-first ordering.

export function Storefront({ store }: StorefrontProps) {
  return (
    <StoreCartProvider storeSlug={store.slug}>
      <StorefrontContent store={store} />
    </StoreCartProvider>
  );
}

function StorefrontContent({ store }: StorefrontProps) {
  const { language } = useLanguage();
  const { mode } = useNavbarMode();
  const copy = getStorefrontCopy(language);
  const cart = useStoreCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartErrorMessage, setCartErrorMessage] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const allProducts = store.products;

  function addToCart(product: StoreProduct) {
    setCartMessage("");
    setCartErrorMessage("");
    cart.addProduct(product);
  }

  function increaseCartLine(productId: string) {
    setCartMessage("");
    setCartErrorMessage("");
    cart.increaseLine(productId);
  }

  function decreaseCartLine(productId: string) {
    setCartMessage("");
    setCartErrorMessage("");
    cart.decreaseLine(productId);
  }

  function removeCartLine(productId: string) {
    setCartMessage("");
    setCartErrorMessage("");
    cart.removeLine(productId);
  }

  function clearCart() {
    setCartMessage("");
    setCartErrorMessage("");
    cart.clearCart();
  }

  async function handleWhatsappOrder() {
    setCartMessage("");
    setCartErrorMessage("");

    if (cart.lines.length === 0) {
      return;
    }

    const whatsappPhone = store.whatsappPhone;

    if (!isValidWhatsappPhone(whatsappPhone)) {
      setCartErrorMessage(copy.whatsappMissing);
      return;
    }

    setIsCreatingOrder(true);

    const whatsappWindow = window.open("about:blank", "_blank");

    try {
      const order = await createPendingStoreOrder(
        store.slug,
        cart.lines.map((line) => ({
          productSlug: line.product.slug,
          quantity: line.quantity,
        })),
        {
          name: "",
          phone: "",
          email: "",
        },
      );

      const whatsappOrderUrl = buildWhatsAppLink(
        whatsappPhone,
        buildWhatsappOrderMessage(store, cart.lines, copy, order.id, mode),
      );

      if (!whatsappOrderUrl) {
        throw new Error(copy.whatsappMissing);
      }

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappOrderUrl;
      } else {
        window.open(whatsappOrderUrl, "_blank", "noopener,noreferrer");
      }

      cart.clearCart();
      setCartMessage(copy.pendingOrderCreated);
    } catch (error) {
      whatsappWindow?.close();
      setCartErrorMessage(error instanceof Error ? error.message : copy.pendingOrderError);
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
              </div>
            </div>
          </div>
        </section>
        <FloatingStoreCart
          copy={copy}
          currency={store.currency}
          isOpen={isCartOpen}
          isCreatingOrder={isCreatingOrder}
          cartMessage={cartMessage}
          cartErrorMessage={cartErrorMessage}
          onOpen={() => setIsCartOpen(true)}
          onClose={() => setIsCartOpen(false)}
          onIncrease={increaseCartLine}
          onDecrease={decreaseCartLine}
          onRemove={removeCartLine}
          onClear={clearCart}
          onWhatsappOrder={handleWhatsappOrder}
        />
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
                    </div>
                  </div>
                </div>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/90 sm:text-lg">{store.description}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <StoreMetric label={copy.products} value={String(allProducts.length)} />
            <div className="hidden md:block">
              <StoreMetric label={copy.cart} value={`${cart.count} ${copy.items}`} />
            </div>
          </div>

          {mode === "detail" ? <RetailPaymentNotice copy={copy} /> : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.catalogKicker}</p>
              <h2 className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{copy.catalogTitle}</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>
      <FloatingStoreCart
        copy={copy}
        currency={store.currency}
        isOpen={isCartOpen}
        isCreatingOrder={isCreatingOrder}
        cartMessage={cartMessage}
        cartErrorMessage={cartErrorMessage}
        onOpen={() => setIsCartOpen(true)}
        onClose={() => setIsCartOpen(false)}
        onIncrease={increaseCartLine}
        onDecrease={decreaseCartLine}
        onRemove={removeCartLine}
        onClear={clearCart}
        onWhatsappOrder={handleWhatsappOrder}
      />
    </div>
  );
}

function RetailPaymentNotice({ copy }: { copy: ReturnType<typeof getStorefrontCopy> }) {
  return (
    <section className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-950 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-100">
      <h2 className="text-base font-black">{copy.retailPaymentTitle}</h2>
      <p className="mt-2 font-bold">{copy.retailPaymentLine1}</p>
      <p className="mt-1 font-bold">{copy.retailPaymentLine2}</p>
      <p className="mt-1 font-bold">{copy.retailPaymentLine3}</p>
    </section>
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
        <StoreProductImage src={product.image} alt={product.title} sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw" className="object-contain p-2" />
      </div>
      <div className="grid gap-2.5 p-3">
        <div>
          <p className="text-xs font-black uppercase text-orange-500">{product.category}</p>
          <h3 className="mt-1 break-words text-base font-black text-gray-950 dark:text-white">{product.title}</h3>
          <p className="mt-1 break-words text-sm leading-5 text-gray-600 dark:text-gray-300">{product.description}</p>
        </div>
        {product.sourceSupplierName ? (
          <p className="break-words text-xs font-bold text-gray-500 dark:text-gray-400">
            {copy.source}: {product.sourceSupplierName}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-black text-gray-950 dark:text-white">{formatStoreMoney(product.price, product.currency)}</p>
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

function FloatingStoreCart({
  copy,
  currency,
  isOpen,
  isCreatingOrder,
  cartMessage,
  cartErrorMessage,
  onOpen,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onWhatsappOrder,
}: {
  copy: ReturnType<typeof getStorefrontCopy>;
  currency: string;
  isOpen: boolean;
  isCreatingOrder: boolean;
  cartMessage: string;
  cartErrorMessage: string;
  onOpen: () => void;
  onClose: () => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onWhatsappOrder: () => void;
}) {
  const cart = useStoreCart();

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed right-[calc(env(safe-area-inset-right)+0.5rem)] top-[calc(env(safe-area-inset-top)+4.25rem)] z-50 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-orange-500 px-2.5 text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-400/30 sm:right-[calc(env(safe-area-inset-right)+1.25rem)] sm:top-[calc(env(safe-area-inset-top)+5.5rem)] sm:min-h-14 sm:min-w-14 sm:px-4"
        aria-label={copy.openCart}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6.2" />
        </svg>
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-gray-950 px-1 text-[10px] font-black text-white ring-2 ring-white dark:bg-white dark:text-gray-950 dark:ring-gray-950 sm:min-h-6 sm:min-w-6 sm:px-1.5 sm:text-xs">
          {cart.count}
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={copy.closeCart}
            onClick={onClose}
            className="absolute inset-0 bg-gray-950/40"
          />
          <aside className="absolute bottom-0 right-0 grid max-h-[88vh] w-full gap-4 overflow-y-auto rounded-t-lg border border-gray-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-gray-900 sm:bottom-5 sm:right-5 sm:max-h-[calc(100vh-40px)] sm:w-[420px] sm:rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-950 dark:text-white">{copy.cartTitle}</h2>
                <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-300">
                  {cart.count} {copy.items}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl font-black text-gray-900 transition hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                aria-label={copy.closeCart}
              >
                ×
              </button>
            </div>

            {cart.lines.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-200 p-4 text-sm leading-6 text-gray-500 dark:border-white/10 dark:text-gray-300">
                {copy.emptyCart}
              </p>
            ) : (
              <div className="grid gap-3">
                {cart.lines.map((line) => (
                  <div key={line.product.id} className="grid gap-3 border-b border-gray-100 pb-3 text-sm dark:border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-black text-gray-950 dark:text-white">{line.product.title}</p>
                        <p className="mt-1 text-gray-500 dark:text-gray-300">
                          {copy.unitPriceLabel}: {formatStoreMoney(line.product.price, line.product.currency)}
                        </p>
                      </div>
                      <p className="shrink-0 font-black text-gray-950 dark:text-white">
                        {formatStoreMoney(line.product.price * line.quantity, line.product.currency)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-grid grid-cols-[36px_48px_36px] overflow-hidden rounded-md border border-gray-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => onDecrease(line.product.id)}
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
                          onClick={() => onIncrease(line.product.id)}
                          aria-label={`${copy.increaseQuantity} ${line.product.title}`}
                          className="min-h-9 bg-white text-sm font-black text-gray-900 transition hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(line.product.id)}
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-gray-200 px-3 text-xs font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:text-gray-100"
                      >
                        {copy.removeFromCart}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="grid gap-2 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-950">
                  <div className="flex items-center justify-between font-bold text-gray-600 dark:text-gray-300">
                    <span>{copy.subtotal}</span>
                    <span>{formatStoreMoney(cart.total, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-black text-gray-950 dark:text-white">
                    <span>{copy.total}</span>
                    <span>{formatStoreMoney(cart.total, currency)}</span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <button
                    type="button"
                    onClick={onWhatsappOrder}
                    disabled={isCreatingOrder}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingOrder ? copy.creatingPendingOrder : copy.whatsappOrder}
                  </button>
                  <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:text-gray-100"
                  >
                    {copy.clearCart}
                  </button>
                </div>

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
        </div>
      ) : null}
    </>
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
  cartLines: StoreCartLine[],
  copy: ReturnType<typeof getStorefrontCopy>,
  orderId?: string,
  mode: "gros" | "detail" = "detail",
) {
  const orderReference = orderId ? `\n${copy.orderReference}: ${orderId.slice(0, 8)}` : "";
  const storeName = mode === "gros" ? copy.grossisteShopfy : store.name;

  const items = cartLines
    .map((line) => {
      const unitPrice = formatStoreMoney(line.product.price, line.product.currency);
      const lineTotal = formatStoreMoney(line.product.price * line.quantity, line.product.currency);

      return [
        `${copy.productBullet} ${copy.productLabel}: ${line.product.title}`,
        `${copy.unitPriceLabel}: ${unitPrice}`,
        `${copy.quantityLabel}: ${line.quantity}`,
        `${copy.totalLabel}: ${lineTotal}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    copy.whatsappOrderGreeting,
    "",
    copy.whatsappOrderIntro,
    orderReference ? `${copy.storeLabel}: ${storeName}${orderReference}` : `${copy.storeLabel}: ${storeName}`,
    "",
    items,
    "",
    copy.whatsappOrderConfirmationRequest,
  ].join("\n");
}

function getStorefrontCopy(language: string) {
  if (language === "fr") {
    return {
      products: "Produits",
      inactiveKicker: "Boutique indisponible",
      inactiveDescription: "Cette boutique est momentanement indisponible.",
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
      openCart: "Ouvrir le panier",
      closeCart: "Fermer le panier",
      emptyCart: "Aucun article dans le panier.",
      subtotal: "Sous-total",
      total: "Total",
      clearCart: "Vider",
      whatsappOrder: "Commander sur WhatsApp",
      creatingPendingOrder: "Creation commande...",
      pendingOrderCreated: "Commande en attente creee. Le vendeur devra la confirmer.",
      pendingOrderError: "Impossible de creer la commande en attente.",
      whatsappMissing: "Cette boutique n'a pas encore de numero WhatsApp.",
      whatsappMessageIntro: "Bonjour, je veux commander dans la boutique",
      whatsappWholesaleMessageIntro: "Bonjour, je veux commander en gros chez",
      grossisteShopfy: "grossiste Shopfy",
      orderReference: "Commande",
      whatsappOrderGreeting: "Bonjour,",
      whatsappOrderIntro: "Je souhaite passer la commande suivante :",
      storeLabel: "Boutique",
      productBullet: "-",
      productLabel: "Produit",
      photoLabel: "Photo",
      unitPriceLabel: "Prix unitaire",
      quantityLabel: "Quantite",
      totalLabel: "Total",
      whatsappOrderConfirmationRequest: "Merci de confirmer la disponibilite de cette commande.",
      retailPaymentTitle: "Paiement a la livraison uniquement",
      retailPaymentLine1: "Pour votre securite, n'effectuez jamais de paiement anticipe directement au vendeur.",
      retailPaymentLine2: "Verifiez toujours le produit lors de la livraison avant de proceder au reglement.",
      retailPaymentLine3: "Restez vigilant face aux offres inhabituelles ou aux demandes de paiement en dehors des procedures recommandees.",
    };
  }

  return {
    products: "Products",
    inactiveKicker: "Store unavailable",
    inactiveDescription: "This store is temporarily unavailable.",
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
    openCart: "Open cart",
    closeCart: "Close cart",
    emptyCart: "No item in the cart.",
    subtotal: "Subtotal",
    total: "Total",
    clearCart: "Clear",
    whatsappOrder: "Order on WhatsApp",
    creatingPendingOrder: "Creating order...",
    pendingOrderCreated: "Pending order created. The seller must confirm it.",
    pendingOrderError: "Unable to create the pending order.",
    whatsappMissing: "This store does not have a WhatsApp number yet.",
    whatsappMessageIntro: "Hello, I want to order from",
    whatsappWholesaleMessageIntro: "Hello, I want to order wholesale from",
    grossisteShopfy: "Shopfy wholesaler",
    orderReference: "Order",
    whatsappOrderGreeting: "Hello,",
    whatsappOrderIntro: "I would like to place the following order:",
    storeLabel: "Store",
    productBullet: "-",
    productLabel: "Product",
    photoLabel: "Photo",
    unitPriceLabel: "Unit price",
    quantityLabel: "Quantity",
    totalLabel: "Total",
    whatsappOrderConfirmationRequest: "Please confirm the availability of this order.",
    retailPaymentTitle: "Payment on delivery only",
    retailPaymentLine1: "For your safety, never make an advance payment directly to the seller.",
    retailPaymentLine2: "Always inspect the product on delivery before paying.",
    retailPaymentLine3: "Stay alert for unusual offers or payment requests outside recommended procedures.",
  };
}
