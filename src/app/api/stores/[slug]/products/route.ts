import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import {
  doesStoreRequireCertification,
  mapProductRow,
  STORE_SELECT_FIELDS,
  type ProductRow,
  type StoreRow,
} from "@/lib/storeRows";
import { cleanImage, cleanPrice, cleanText } from "@/lib/validation";
import type { StoreProduct } from "@/types/storefront";

type StoreProductsRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type ImportProductRequest = {
  product?: StoreProduct;
};

export async function POST(request: Request, context: StoreProductsRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);
  const body = (await request.json()) as ImportProductRequest;
  const product = body.product;

  if (!cleanSlug || !product) {
    return NextResponse.json({ message: "Missing store or product." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Connectez-vous pour importer des produits." }, { status: 401 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, currency, owner_user_id, created_at, is_certified, certification_expires_at")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Store not found. Create the store in Supabase first." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez modifier que votre propre boutique." }, { status: 403 });
    }

    if (doesStoreRequireCertification(storeData)) {
      return NextResponse.json(
        { message: "Essai gratuit termine. Activez/certifiez votre boutique pour ajouter des produits." },
        { status: 403 },
      );
    }

    const imageUrl = cleanImage(product.image);
    const payload = {
      store_id: storeData.id,
      slug: cleanText(product.slug),
      title: cleanText(product.title),
      description: cleanText(product.description),
      category: cleanText(product.category, "General"),
      image_url: imageUrl,
      price: cleanPrice(product.price),
      compare_at_price: product.compareAtPrice ? cleanPrice(product.compareAtPrice) : null,
      currency: cleanText(product.currency || storeData.currency || "XOF").toUpperCase(),
      inventory_quantity: Number.isFinite(product.inventoryQuantity) ? Math.max(0, Math.trunc(product.inventoryQuantity)) : 0,
      source_supplier_name: cleanText(product.sourceSupplierName),
      source_supplier_slug: cleanText(product.sourceSupplierSlug),
      source_product_id: product.sourceSupplierName ? cleanText(product.id) : null,
    };

    if (!payload.slug || !payload.title || !payload.image_url || payload.price <= 0) {
      return NextResponse.json({ message: "Product slug, title, image, and price are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("shopfy_store_products")
      .upsert(payload, { onConflict: "store_id,slug" })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message || "Product import failed." }, { status: error?.code === "42501" ? 403 : 500 });
    }

    const { data: refreshedStore } = await supabase
      .from("shopfy_stores")
      .select(STORE_SELECT_FIELDS)
      .eq("slug", cleanSlug)
      .single();

    const refreshedProduct = ((refreshedStore as StoreRow | null)?.shopfy_store_products || [])
      .find((item) => item.slug === payload.slug);

    return NextResponse.json({ product: mapProductRow((refreshedProduct || data) as ProductRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
