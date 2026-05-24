import type { Product } from "@/types/marketplace";

export function getSellerProfileHref(product: Product) {
  return `/seller/${encodeURIComponent(product.sellerPhone)}`;
}

export function getSellerDisplayName(product?: Product | null) {
  return product?.sellerName || "Vendeur Shopfy";
}

export function getSellerInitials(name: string) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  const initials = words.map((word) => word[0]?.toUpperCase()).join("");

  return initials || "S";
}
