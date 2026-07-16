import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import { mapProductRow, type ProductRow } from "@/lib/storeRows";
import { cleanImage, cleanPrice, cleanText, hasUnsafeObjectKeys } from "@/lib/validation";
import type { StoreProduct } from "@/types/storefront";

type StoreProductRouteContext = {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
};

type UpdateProductRequest = {
  product?: Partial<StoreProduct>;
};

export async function PATCH(request: Request, context: StoreProductRouteContext) {
  const { slug, productId } = await context.params;
  const cleanSlug = cleanText(slug);
  const cleanProductId = cleanText(productId);
  const body = (await request.json().catch(() => ({}))) as UpdateProductRequest;

  if (hasUnsafeObjectKeys(body)) {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!cleanSlug || !cleanProductId || !body.product) {
    return NextResponse.json({ message: "Missing store or product." }, { status: 400 });
  }

  const product = body.product;
  const imageUrl = product.image === undefined ? undefined : cleanImage(product.image) || cleanText(product.image);
  const payload = {
    ...(product.title !== undefined ? { title: cleanText(product.title) } : {}),
    ...(product.description !== undefined ? { description: cleanText(product.description) } : {}),
    ...(product.category !== undefined ? { category: cleanText(product.category, "General") } : {}),
    ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
    ...(product.price !== undefined ? { price: cleanPrice(product.price) } : {}),
    ...(product.compareAtPrice !== undefined ? { compare_at_price: product.compareAtPrice ? cleanPrice(product.compareAtPrice) : null } : {}),
    ...(product.currency !== undefined ? { currency: cleanText(product.currency, "XOF").toUpperCase() } : {}),
    ...(product.inventoryQuantity !== undefined ? { inventory_quantity: Number.isFinite(product.inventoryQuantity) ? Math.max(0, Math.trunc(product.inventoryQuantity)) : 0 } : {}),
  };

  if ("title" in payload && !payload.title) {
    return NextResponse.json({ message: "Product title is required." }, { status: 400 });
  }

  if (payload.price !== undefined && payload.price <= 0) {
    return NextResponse.json({ message: "Product price is required." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Connectez-vous pour modifier un produit." }, { status: 401 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, owner_user_id")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez modifier que votre propre boutique." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("shopfy_store_products")
      .update(payload)
      .eq("store_id", storeData.id)
      .eq("id", cleanProductId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message || "Product update failed." }, { status: error?.code === "42501" ? 403 : 500 });
    }

    return NextResponse.json({ product: mapProductRow(data as ProductRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: StoreProductRouteContext) {
  const { slug, productId } = await context.params;
  const cleanSlug = cleanText(slug);
  const cleanProductId = cleanText(productId);

  if (!cleanSlug || !cleanProductId) {
    return NextResponse.json({ message: "Missing store or product." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Connectez-vous pour retirer un produit." }, { status: 401 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, owner_user_id")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez modifier que votre propre boutique." }, { status: 403 });
    }

    const { error } = await supabase
      .from("shopfy_store_products")
      .delete()
      .eq("store_id", storeData.id)
      .eq("id", cleanProductId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: error.code === "42501" ? 403 : 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
