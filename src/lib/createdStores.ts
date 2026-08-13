import type { ShopfyStore } from "@/types/storefront";
import { normalizeWhatsappPhone } from "@/lib/whatsapp";
import type { StoreContact, StoreKind } from "@/lib/resellerStore";

export type CreateStoreInput = {
  kind?: StoreKind;
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
  reseller?: StoreContact;
  futureOwner?: StoreContact;
};

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

  return {
    slug,
    name: input.name.trim(),
    tagline: input.tagline.trim() || `Boutique ${input.category.toLowerCase()} creee avec Shopfy.`,
    description: input.description.trim() || "Une boutique vendeur neutre creee sur Shopfy.",
    logoUrl: input.logoUrl?.trim() || "",
    bannerUrl: input.bannerUrl?.trim() || "",
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
