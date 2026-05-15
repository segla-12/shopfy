import type { Product } from "@/types/marketplace";

export function sortProductsByMarketplacePriority(products: Product[]) {
  return [...products].sort((a, b) => {
    const certificationPriority = Number(Boolean(b.isCertified)) - Number(Boolean(a.isCertified));

    if (certificationPriority !== 0) {
      return certificationPriority;
    }

    return getProductDate(b) - getProductDate(a);
  });
}

function getProductDate(product: Product) {
  return new Date(product.createdAt || 0).getTime() || 0;
}
