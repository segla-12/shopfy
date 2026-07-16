import type { Product } from "@/types/marketplace";

function normalizeSupplierIdentifier(value: string) {
  return String(value || "").replace(/\s+/gu, " ").trim();
}

export function getSellerProfileHref(product: Product) {
  return getSupplierProfileHref(product.sellerPhone);
}

export function getSupplierProfileHref(phone: string) {
  const supplierIdentifier = normalizeSupplierIdentifier(phone);
  return supplierIdentifier ? `/seller/${encodeURIComponent(supplierIdentifier)}` : "/stores";
}

export function getSellerDisplayName(product?: Product | null) {
  return product?.sellerName || "Shopfy Seller";
}

export function getSellerInitials(name: string) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  const initials = words.map((word) => word[0]?.toUpperCase()).join("");

  return initials || "S";
}
