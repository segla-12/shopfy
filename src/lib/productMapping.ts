import type { Product, SupabaseProductRow } from "@/types/marketplace";
import { getPhoneCountryByDialCode } from "@/lib/phoneCountries";

export const PRODUCT_SELECT_FIELDS = "id,title,price,image,description,category,phone,location,is_certified,created_at";
export const PRODUCT_SELECT_FIELDS_WITH_FEATURES = [
  "id",
  "title",
  "price",
  "image",
  "description",
  "category",
  "phone",
  "location",
  "country",
  "city",
  "seller_name",
  "seller_photo",
  "is_certified",
  "certification_started_at",
  "certification_expires_at",
  "certification_duration_months",
  "certification_amount",
  "created_at",
].join(",");

export function mapSupabaseProduct(row: SupabaseProductRow): Product {
  const certificationExpiresAt = row.certification_expires_at || undefined;
  const isCertificationActive = Boolean(row.is_certified) && isFutureOrMissingDate(certificationExpiresAt);
  const phoneCountry = getPhoneCountryByDialCode(row.phone);
  const country = row.country || phoneCountry?.code || undefined;
  const city = row.city || row.location || undefined;

  return {
    id: String(row.id ?? row.created_at),
    title: row.title,
    price: Number(row.price),
    image: row.image,
    images: [row.image],
    description: row.description,
    category: row.category,
    location: row.location || undefined,
    country,
    city,
    sellerPhone: row.phone,
    sellerName: row.seller_name || "Vendeur Shopfy",
    sellerPhoto: row.seller_photo || undefined,
    isCertified: isCertificationActive,
    certificationStartedAt: row.certification_started_at || undefined,
    certificationExpiresAt,
    certificationDurationMonths: row.certification_duration_months || undefined,
    certificationAmount: row.certification_amount || undefined,
    createdAt: row.created_at,
  };
}

function isFutureOrMissingDate(date?: string) {
  if (!date) {
    return true;
  }

  return new Date(date).getTime() > Date.now();
}
