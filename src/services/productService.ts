import type {
  Product,
  ProductCertificationInput,
  ProductCreateInput,
  ProductOwnershipInput,
  ProductUpdateInput,
  SupabaseProductRow,
} from "@/types/marketplace";
import { toEnglishOptionalText, toEnglishText } from "@/lib/englishText";
import { toEnglishWholesaleDescription } from "@/lib/productWholesale";
import { supabase } from "@/lib/supabase";
import {
  mapSupabaseProduct,
  PRODUCT_SELECT_FIELDS,
  PRODUCT_SELECT_FIELDS_WITH_FEATURES,
} from "@/lib/productMapping";
import { isValidWhatsappPhone, normalizeWhatsappPhone } from "@/lib/whatsapp";

export async function getProducts(): Promise<Product[]> {
  const result = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS_WITH_FEATURES)
    .order("is_certified", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .order("is_certified", { ascending: false })
      .order("created_at", { ascending: false });

    return fallback.error ? [] : mapProductRows(fallback.data);
  }

  return mapProductRows(result.data);
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS_WITH_FEATURES)
    .eq("id", id)
    .single();

  if (result.error) {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .eq("id", id)
      .single();

    return fallback.error ? null : mapSupabaseProduct(fallback.data as unknown as SupabaseProductRow);
  }

  return mapSupabaseProduct(result.data as unknown as SupabaseProductRow);
}

export async function createProduct(product: ProductCreateInput): Promise<Product | null> {
  const sellerPhone = normalizeWhatsappPhone(product.sellerPhone);

  if (!isValidWhatsappPhone(sellerPhone)) {
    return null;
  }

  const englishProduct = {
    ...product,
    sellerPhone,
    title: toEnglishText(product.title),
    description: toEnglishWholesaleDescription(product.description),
    location: toEnglishOptionalText(product.location) || "",
    city: toEnglishOptionalText(product.city || product.location) || "",
    sellerName: toEnglishText(product.sellerName || "Shopfy Seller", "Shopfy Seller"),
  };
  const { data, error } = await supabase
    .from("products")
    .insert({
      title: englishProduct.title,
      price: englishProduct.price,
      image: englishProduct.image,
      description: englishProduct.description,
      category: englishProduct.category,
      phone: englishProduct.sellerPhone,
      location: englishProduct.location,
      country: englishProduct.country || "",
      city: englishProduct.city,
      seller_name: englishProduct.sellerName,
      seller_photo: englishProduct.sellerPhoto || "",
      is_certified: false,
    })
    .select(PRODUCT_SELECT_FIELDS_WITH_FEATURES)
    .single();

  if (error) {
    const fallbackInsert = await supabase
      .from("products")
      .insert({
        title: englishProduct.title,
        price: englishProduct.price,
        image: englishProduct.image,
        description: englishProduct.description,
        category: englishProduct.category,
        phone: englishProduct.sellerPhone,
        location: englishProduct.location,
        is_certified: false,
      })
      .select(PRODUCT_SELECT_FIELDS)
      .single();

    if (!fallbackInsert.error && fallbackInsert.data) {
      return mapSupabaseProduct(fallbackInsert.data);
    }

    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .eq("title", englishProduct.title)
      .eq("phone", englishProduct.sellerPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fallback.error) {
      return null;
    }

    return mapSupabaseProduct(fallback.data);
  }

  return mapSupabaseProduct(data as unknown as SupabaseProductRow);
}

export async function getProductsByPhone(phone: string): Promise<Product[]> {
  const cleanPhone = String(phone || "").trim();
  const normalizedPhone = normalizeWhatsappPhone(cleanPhone);
  const phoneMatches = Array.from(new Set([cleanPhone, normalizedPhone].filter(Boolean)));
  const result = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS_WITH_FEATURES)
    .in("phone", phoneMatches)
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error("[seller] Supabase product lookup with feature fields failed.", {
      phone: cleanPhone,
      error: result.error.message,
    });

    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .in("phone", phoneMatches)
      .order("created_at", { ascending: false });

    if (fallback.error) {
      console.error("[seller] Supabase product lookup fallback failed.", {
        phone: cleanPhone,
        error: fallback.error.message,
      });

      return [];
    }

    return mapProductRows(fallback.data);
  }

  return mapProductRows(result.data);
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

function mapProductRows(rows: unknown) {
  return ((rows || []) as SupabaseProductRow[]).map(mapSupabaseProduct);
}
