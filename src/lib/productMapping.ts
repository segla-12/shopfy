import type { Product, SupabaseProductRow } from "@/types/marketplace";

export const PRODUCT_SELECT_FIELDS = "id,title,price,image,description,category,phone,location,is_certified,created_at";

export function mapSupabaseProduct(row: SupabaseProductRow): Product {
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
    isCertified: row.is_certified,
    createdAt: row.created_at,
  };
}
