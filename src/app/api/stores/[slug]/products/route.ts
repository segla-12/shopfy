import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import {
  doesStoreRequireCertification,
  mapProductRow,
  STORE_SELECT_FIELDS,
  type ProductRow,
  type StoreRow,
} from "@/lib/storeRows";
import { cleanImage, cleanPrice, cleanText, hasUnsafeObjectKeys } from "@/lib/validation";
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
  const body = (await request.json().catch(() => ({}))) as ImportProductRequest;

  if (hasUnsafeObjectKeys(body)) {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const product = body.product;

  if (!cleanSlug || !product) {
    return NextResponse.json({ message: "Missing store or product." }, { status: 400 });
  }

  try {
    console.info("[api-store-products] Product save request received.", { storeSlug: cleanSlug });
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      console.error("[api-store-products] Authentication failed.", authError);
      return NextResponse.json({ message: "Connectez-vous pour importer des produits." }, { status: 401 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, currency, owner_user_id, created_at, is_certified, certification_expires_at")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      console.error("[api-store-products] Store lookup failed.", { storeSlug: cleanSlug, error: storeError });
      return NextResponse.json({ message: "Store not found. Create the store in Supabase first." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      console.error("[api-store-products] Store ownership check failed.", {
        storeSlug: cleanSlug,
        ownerUserId: storeData.owner_user_id,
        authUserId: authData.user.id,
      });
      return NextResponse.json({ message: "Vous ne pouvez modifier que votre propre boutique." }, { status: 403 });
    }

    if (doesStoreRequireCertification(storeData)) {
      console.error("[api-store-products] Store certification is required.", { storeSlug: cleanSlug });
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
      console.error("[api-store-products] Product payload validation failed.", {
        storeSlug: cleanSlug,
        hasSlug: Boolean(payload.slug),
        hasTitle: Boolean(payload.title),
        hasImage: Boolean(payload.image_url),
        price: payload.price,
      });
      return NextResponse.json({ message: "Product slug, title, image, and price are required." }, { status: 400 });
    }

    const { data: existingProduct, error: existingError } = await supabase
      .from("shopfy_store_products")
      .select("id")
      .eq("store_id", storeData.id)
      .eq("slug", payload.slug)
      .maybeSingle();

    if (existingError) {
      console.error("[api-store-products] Existing product validation failed.", {
        storeSlug: cleanSlug,
        productSlug: payload.slug,
        error: existingError,
      });
      return NextResponse.json(
        { message: existingError.message || "Unable to validate existing product." },
        { status: 500 },
      );
    }

    if (existingProduct) {
      console.error("[api-store-products] Product slug already exists.", {
        storeSlug: cleanSlug,
        productSlug: payload.slug,
      });
      return NextResponse.json(
        { message: "Un produit avec ce slug existe deja dans cette boutique. Choisissez un autre nom." },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("shopfy_store_products")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error("[api-store-products] Product insert failed.", {
        storeSlug: cleanSlug,
        productSlug: payload.slug,
        error,
      });
      return NextResponse.json({ message: error?.message || "Product import failed." }, { status: error?.code === "23505" ? 409 : 500 });
    }

    console.info("[api-store-products] Product inserted.", {
      storeSlug: cleanSlug,
      productId: data.id,
      productSlug: payload.slug,
    });

    return NextResponse.json({ product: mapProductRow(data as ProductRow) });
  } catch (error) {
    console.error("[api-store-products] Unexpected product save error.", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Product save failed." },
      { status: 500 },
    );
  }
}
