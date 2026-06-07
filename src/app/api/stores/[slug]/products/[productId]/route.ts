import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import { cleanText } from "@/lib/validation";

type StoreProductRouteContext = {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
};

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
