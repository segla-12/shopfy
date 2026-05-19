import type { Product, SupabaseProductRow } from "@/types/marketplace";

export const PRODUCT_SELECT_FIELDS = "id,title,price,image,description,category,phone,location,is_certified,created_at";
export const PRODUCT_SELECT_FIELDS_WITH_CERTIFICATION = [
  "id",
  "title",
  "price",
  "image",
  "description",
  "category",
  "phone",
  "location",
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

  return {
    id: String(row.id ?? row.created_at),
    title: row.title,
    price: Number(row.price),
    image: row.image,
    images: [row.image],
    description: row.description,
    category: row.category,
    location: row.location || undefined,
    sellerPhone: row.phone,
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
