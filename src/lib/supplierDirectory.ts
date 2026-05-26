import type { Product, WholesaleSupplier } from "@/types/marketplace";

export function buildWholesaleSuppliers(products: Product[]): WholesaleSupplier[] {
  const groups = new Map<string, Product[]>();

  products.forEach((product) => {
    const supplierKey = product.sellerPhone || product.sellerName || product.id;
    const supplierProducts = groups.get(supplierKey) || [];

    supplierProducts.push(product);
    groups.set(supplierKey, supplierProducts);
  });

  return Array.from(groups.entries())
    .map(([supplierKey, supplierProducts]) => buildWholesaleSupplier(supplierKey, supplierProducts))
    .sort(sortSuppliers);
}

export function filterWholesaleSuppliers(
  suppliers: WholesaleSupplier[],
  filters: {
    query?: string;
    category?: string;
    country?: string;
    city?: string;
  },
) {
  const normalizedQuery = normalizeSearch(filters.query || "");

  return suppliers.filter((supplier) => {
    const searchableSupplier = normalizeSearch([
      supplier.name,
      supplier.city,
      supplier.location,
      supplier.deliveryMethods.join(" "),
      supplier.deliveryServices.join(" "),
      supplier.categories.join(" "),
      supplier.products.map((product) => product.title).join(" "),
    ].filter(Boolean).join(" "));
    const matchesQuery = !normalizedQuery || searchableSupplier.includes(normalizedQuery);
    const matchesCategory = !filters.category || filters.category === "Tous" || supplier.categories.includes(filters.category);
    const matchesCountry = !filters.country || supplier.country === filters.country;
    const matchesCity = !filters.city || supplier.city === filters.city || supplier.location === filters.city;

    return matchesQuery && matchesCategory && matchesCountry && matchesCity;
  });
}

export function getSupplierProductsForCatalog(products: Product[]) {
  return [...products].sort((firstProduct, secondProduct) => (
    firstProduct.title.localeCompare(secondProduct.title)
  ));
}

function buildWholesaleSupplier(supplierKey: string, products: Product[]): WholesaleSupplier {
  const profileProduct = products.find((product) => product.sellerName || product.sellerPhoto) || products[0];
  const joinedDates = products
    .map((product) => product.createdAt)
    .filter(Boolean)
    .map((date) => new Date(String(date)).getTime())
    .filter((time) => Number.isFinite(time));
  const firstJoinedAt = joinedDates.length > 0 ? new Date(Math.min(...joinedDates)).toISOString() : undefined;

  return {
    id: supplierKey,
    name: profileProduct?.sellerName || "Fournisseur grossiste",
    phone: profileProduct?.sellerPhone || supplierKey,
    photo: profileProduct?.sellerPhoto,
    country: profileProduct?.country || firstDefined(products.map((product) => product.country)),
    city: profileProduct?.city || firstDefined(products.map((product) => product.city)),
    location: profileProduct?.location || firstDefined(products.map((product) => product.location)),
    latitude: profileProduct?.latitude ?? firstDefinedNumber(products.map((product) => product.latitude)),
    longitude: profileProduct?.longitude ?? firstDefinedNumber(products.map((product) => product.longitude)),
    deliveryMethods: uniqueValues(products.map((product) => product.deliveryMethod)),
    deliveryServices: uniqueValues(products.map((product) => product.deliveryServiceName)),
    deliveryContacts: uniqueValues(products.map((product) => product.deliveryContact)),
    categories: uniqueValues(products.map((product) => product.category)),
    products,
    productCount: products.length,
    isCertified: products.some((product) => product.isCertified),
    firstProductImage: profileProduct?.image || products[0]?.image,
    firstJoinedAt,
  };
}

function sortSuppliers(firstSupplier: WholesaleSupplier, secondSupplier: WholesaleSupplier) {
  const certificationPriority = Number(secondSupplier.isCertified) - Number(firstSupplier.isCertified);

  if (certificationPriority !== 0) {
    return certificationPriority;
  }

  const catalogPriority = secondSupplier.productCount - firstSupplier.productCount;

  if (catalogPriority !== 0) {
    return catalogPriority;
  }

  return firstSupplier.name.localeCompare(secondSupplier.name);
}

function uniqueValues<T extends string>(values: Array<T | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as T[]));
}

function firstDefined(values: Array<string | undefined>) {
  return values.find((value) => Boolean(value?.trim()));
}

function firstDefinedNumber(values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value));
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
