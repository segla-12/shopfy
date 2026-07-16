import type { ShopfyStore, StoreProduct, SupplierSourceProduct } from "@/types/storefront";

export const demoStores: ShopfyStore[] = [];

export const supplierSourceProducts: SupplierSourceProduct[] = [
  {
    id: "source-denim-jacket",
    slug: "oversized-denim-jacket",
    title: "Oversized denim jacket",
    description: "Heavy cotton denim jacket with wide fit, metal buttons, and resale-ready packaging.",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    wholesalePrice: 8500,
    recommendedRetailPrice: 18500,
    currency: "XOF",
    minimumOrderQuantity: 12,
    supplierName: "Global Apparel Supply",
    supplierSlug: "global-apparel-supply",
  },
  {
    id: "source-crossbody-bag",
    slug: "minimal-crossbody-bag",
    title: "Minimal crossbody bag",
    description: "Small vegan leather crossbody bag with zip closure and adjustable strap.",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    wholesalePrice: 6000,
    recommendedRetailPrice: 14000,
    currency: "XOF",
    minimumOrderQuantity: 20,
    supplierName: "Urban Bags Wholesale",
    supplierSlug: "urban-bags-wholesale",
  },
  {
    id: "source-beauty-kit",
    slug: "travel-beauty-kit",
    title: "Travel beauty kit",
    description: "Compact travel kit with cosmetic pouch, applicators, mirror, and refill bottles.",
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    wholesalePrice: 4500,
    recommendedRetailPrice: 12000,
    currency: "XOF",
    minimumOrderQuantity: 30,
    supplierName: "Beauty Trade House",
    supplierSlug: "beauty-trade-house",
  },
  {
    id: "source-white-sneakers",
    slug: "clean-white-sneakers",
    title: "Clean white sneakers",
    description: "Low-top everyday sneakers with padded collar and durable rubber sole.",
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
    wholesalePrice: 9000,
    recommendedRetailPrice: 22000,
    currency: "XOF",
    minimumOrderQuantity: 18,
    supplierName: "Continental Footwear",
    supplierSlug: "continental-footwear",
  },
];

export function getDemoStore(slug: string) {
  return demoStores.find((store) => store.slug === slug) || null;
}

export function createImportedStoreProduct(sourceProduct: SupplierSourceProduct): StoreProduct {
  return {
    id: `imported-${sourceProduct.id}`,
    slug: sourceProduct.slug,
    title: sourceProduct.title,
    description: sourceProduct.description,
    category: sourceProduct.category,
    image: sourceProduct.image,
    price: sourceProduct.recommendedRetailPrice,
    compareAtPrice: Math.round(sourceProduct.recommendedRetailPrice * 1.18),
    currency: sourceProduct.currency,
    inventoryQuantity: 20,
    sourceSupplierName: sourceProduct.supplierName,
    sourceSupplierSlug: sourceProduct.supplierSlug,
  };
}

export function formatStoreMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
