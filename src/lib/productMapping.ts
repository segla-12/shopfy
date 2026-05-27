import type { Product, SupabaseProductRow } from "@/types/marketplace";
import { toEnglishOptionalText, toEnglishText } from "@/lib/englishText";
import { getPhoneCountryByDialCode } from "@/lib/phoneCountries";
import { extractWholesaleMetadata, getProductImages, toEnglishWholesaleDescription } from "@/lib/productWholesale";

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
  const { description, metadata } = extractWholesaleMetadata(toEnglishWholesaleDescription(row.description));
  const certificationExpiresAt = row.certification_expires_at || undefined;
  const isCertificationActive = Boolean(row.is_certified) && isFutureOrMissingDate(certificationExpiresAt);
  const phoneCountry = getPhoneCountryByDialCode(row.phone);
  const country = row.country || metadata.geo?.country || phoneCountry?.code || undefined;
  const city = row.city || metadata.geo?.city || row.location || undefined;

  return {
    id: String(row.id ?? row.created_at),
    title: toEnglishText(row.title),
    price: Number(row.price),
    image: row.image,
    images: getProductImages(row.image, metadata.images),
    description,
    category: row.category,
    location: toEnglishOptionalText(row.location || metadata.geo?.city),
    country,
    city: toEnglishOptionalText(city),
    latitude: metadata.geo?.latitude,
    longitude: metadata.geo?.longitude,
    minimumOrderQuantity: toEnglishOptionalText(metadata.minimumOrderQuantity),
    wholesalePrice: Number(row.price),
    deliveryMethod: toEnglishOptionalText(metadata.delivery?.method),
    deliveryServiceName: toEnglishOptionalText(metadata.delivery?.serviceName),
    deliveryContact: metadata.delivery?.contact,
    sellerPhone: row.phone,
    sellerName: toEnglishText(row.seller_name || "Shopfy Seller", "Shopfy Seller"),
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
