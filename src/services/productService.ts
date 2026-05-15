import type {
  Product,
  ProductCertificationInput,
  ProductCreateInput,
  ProductOwnershipInput,
  ProductUpdateInput,
} from "@/types/marketplace";
import { supabase } from "@/lib/supabase";
import { mapSupabaseProduct, PRODUCT_SELECT_FIELDS } from "@/lib/productMapping";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .order("is_certified", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data || []).map(mapSupabaseProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return mapSupabaseProduct(data);
}

export async function createProduct(product: ProductCreateInput): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      title: product.title,
      price: product.price,
      image: product.image,
      description: product.description,
      category: product.category,
      phone: product.sellerPhone,
      location: product.location || "",
      is_certified: false,
    })
    .select(PRODUCT_SELECT_FIELDS)
    .single();

  if (error) {
    return null;
  }

  return mapSupabaseProduct(data);
}

export async function getProductsByPhone(phone: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("phone", phone)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data || []).map(mapSupabaseProduct);
}

export async function updateProductByPhone(
  ownership: ProductOwnershipInput,
  updates: ProductUpdateInput,
): Promise<Product | null> {
  const response = await fetch("/api/products/manage", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ownership, updates }),
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.product || null;
}

export async function deleteProductByPhone(ownership: ProductOwnershipInput): Promise<boolean> {
  const response = await fetch("/api/products/manage", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ownership }),
  });

  return response.ok;
}

export async function setProductCertification(_input: ProductCertificationInput): Promise<Product | null> {
  void _input;
  return null;
}
