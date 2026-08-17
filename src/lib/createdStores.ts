import type { ShopfyStore } from "@/types/storefront";
import { normalizeWhatsappPhone } from "@/lib/whatsapp";

export type CreateStoreInput = {
  name: string;
  category: string;
  ownerName: string;
  city: string;
  country: string;
  tagline: string;
  description: string;
  currency: string;
  whatsappPhone: string;
  logoUrl?: string;
  bannerUrl?: string;
};

const defaultStoreImages: Record<string, string> = {
  fashion: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  shoes: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
  accessories: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
  electronics: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1000&q=80",
  home: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1000&q=80",
  food: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1000&q=80",
  general: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80",
  other: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80",
};

const defaultStoreLogo = "/shopfy-logo-clean.png";

export function getDefaultStoreImage(category: string) {
  const normalizedCategory = category.trim().toLowerCase();
  return defaultStoreImages[normalizedCategory] || defaultStoreImages.general;
}

export function getDefaultStoreLogo() {
  return defaultStoreLogo;
}

export function createStoreSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "my-shopfy-store";
}

export function buildCreatedStore(input: CreateStoreInput): ShopfyStore {
  const slug = createStoreSlug(input.name);
  const defaultImage = getDefaultStoreImage(input.category);

  return {
    slug,
    name: input.name.trim(),
    tagline: input.tagline.trim() || `Boutique ${input.category.toLowerCase()} creee avec Shopfy.`,
    description: input.description.trim() || "Une boutique vendeur neutre creee sur Shopfy.",
    logoUrl: input.logoUrl?.trim() || getDefaultStoreLogo(),
    bannerUrl: input.bannerUrl?.trim() || defaultImage,
    ownerName: input.ownerName.trim(),
    city: input.city.trim(),
    country: input.country.trim(),
    currency: input.currency,
    whatsappPhone: normalizeWhatsappPhone(input.whatsappPhone),
    theme: {
      primary: "#111827",
      accent: "#f97316",
    },
    products: [],
    stats: {
      products: 0,
      orders: 0,
      revenue: 0,
      conversionRate: 0,
    },
  };
}
