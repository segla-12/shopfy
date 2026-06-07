import type { ShopfyStore, StoreProduct } from "@/types/storefront";

export type StoreRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner_name: string | null;
  city: string | null;
  country: string | null;
  currency: string | null;
  whatsapp_phone: string | null;
  is_certified?: boolean | null;
  certification_started_at?: string | null;
  certification_expires_at?: string | null;
  certification_duration_months?: number | null;
  certification_amount?: number | string | null;
  created_at?: string | null;
  primary_color: string | null;
  accent_color: string | null;
  orders_count: number | null;
  revenue_amount: number | string | null;
  conversion_rate: number | string | null;
  shopfy_store_products?: ProductRow[];
};

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number | string | null;
  compare_at_price: number | string | null;
  currency: string | null;
  inventory_quantity: number | null;
  source_supplier_name: string | null;
  source_supplier_slug: string | null;
  source_product_id: string | null;
};

export const STORE_SELECT_FIELDS = `
  *,
  shopfy_store_products (
    id,
    slug,
    title,
    description,
    category,
    image_url,
    price,
    compare_at_price,
    currency,
    inventory_quantity,
    source_supplier_name,
    source_supplier_slug,
    source_product_id
  )
`;

export const STORE_TRIAL_DAYS = 7;
const dayInMs = 24 * 60 * 60 * 1000;

export function mapStoreRow(row: StoreRow): ShopfyStore {
  const products = (row.shopfy_store_products || []).map(mapProductRow);
  const certificationExpiresAt = row.certification_expires_at || undefined;
  const isCertificationActive = Boolean(row.is_certified) && isFutureOrMissingDate(certificationExpiresAt);
  const trialStatus = getStoreTrialStatus(row.created_at);

  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline || "",
    description: row.description || "",
    logoUrl: row.logo_url || "",
    bannerUrl: row.banner_url || "",
    ownerName: row.owner_name || "",
    city: row.city || "",
    country: row.country || "Benin",
    currency: row.currency || "XOF",
    whatsappPhone: row.whatsapp_phone || "",
    isCertified: isCertificationActive,
    createdAt: row.created_at || undefined,
    trialEndsAt: trialStatus.trialEndsAt,
    trialDaysRemaining: trialStatus.trialDaysRemaining,
    isTrialActive: trialStatus.isTrialActive,
    requiresCertification: !isCertificationActive && !trialStatus.isTrialActive,
    certificationStartedAt: row.certification_started_at || undefined,
    certificationExpiresAt,
    certificationDurationMonths: row.certification_duration_months || undefined,
    certificationAmount: row.certification_amount === null || row.certification_amount === undefined
      ? undefined
      : Number(row.certification_amount),
    theme: {
      primary: row.primary_color || "#111827",
      accent: row.accent_color || "#f97316",
    },
    products,
    stats: {
      products: products.length,
      orders: Number(row.orders_count || 0),
      revenue: Number(row.revenue_amount || 0),
      conversionRate: Number(row.conversion_rate || 0),
    },
  };
}

export function doesStoreRequireCertification(row: {
  created_at?: string | null;
  is_certified?: boolean | null;
  certification_expires_at?: string | null;
}) {
  const isCertificationActive = Boolean(row.is_certified) && isFutureOrMissingDate(row.certification_expires_at || undefined);
  return !isCertificationActive && !getStoreTrialStatus(row.created_at).isTrialActive;
}

export function getStoreTrialStatus(createdAt?: string | null) {
  const createdTime = getValidTime(createdAt);
  const trialEndsTime = createdTime + STORE_TRIAL_DAYS * dayInMs;
  const now = Date.now();

  return {
    trialEndsAt: new Date(trialEndsTime).toISOString(),
    isTrialActive: trialEndsTime > now,
    trialDaysRemaining: Math.max(0, Math.ceil((trialEndsTime - now) / dayInMs)),
  };
}

function isFutureOrMissingDate(date?: string) {
  if (!date) {
    return true;
  }

  return new Date(date).getTime() > Date.now();
}

function getValidTime(date?: string | null) {
  const time = date ? new Date(date).getTime() : NaN;
  return Number.isFinite(time) ? time : Date.now();
}

export function mapProductRow(row: ProductRow): StoreProduct {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    category: row.category || "General",
    image: row.image_url || "",
    price: Number(row.price || 0),
    compareAtPrice: row.compare_at_price === null || row.compare_at_price === undefined
      ? undefined
      : Number(row.compare_at_price),
    currency: row.currency || "XOF",
    inventoryQuantity: Number(row.inventory_quantity || 0),
    sourceSupplierName: row.source_supplier_name || undefined,
    sourceSupplierSlug: row.source_supplier_slug || undefined,
  };
}
