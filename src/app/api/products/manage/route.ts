import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { mapSupabaseProduct, PRODUCT_SELECT_FIELDS } from "@/lib/productMapping";
import { cleanImage, cleanPrice, cleanText } from "@/lib/validation";

type ManageRequest = {
  ownership?: {
    productId?: string;
    sellerPhone?: string;
  };
  updates?: {
    title?: string;
    price?: number;
    image?: string;
    description?: string;
    location?: string;
    category?: string;
  };
};

export async function PATCH(request: Request) {
  const body = await request.json() as ManageRequest;
  const productId = cleanText(body.ownership?.productId);
  const sellerPhone = cleanText(body.ownership?.sellerPhone);

  if (!productId || !sellerPhone) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const updates = body.updates || {};
  const image = updates.image === undefined ? undefined : cleanImage(updates.image);
  const payload = {
    ...(updates.title !== undefined ? { title: cleanText(updates.title) } : {}),
    ...(updates.price !== undefined ? { price: cleanPrice(updates.price) } : {}),
    ...(image !== undefined && image ? { image } : {}),
    ...(updates.description !== undefined ? { description: cleanText(updates.description) } : {}),
    ...(updates.category !== undefined ? { category: cleanText(updates.category) } : {}),
    ...(updates.location !== undefined ? { location: cleanText(updates.location) } : {}),
  };

  let data;
  let error;

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const result = await supabaseAdmin
      .from("products")
      .update(payload)
      .eq("id", productId)
      .eq("phone", sellerPhone)
      .select(PRODUCT_SELECT_FIELDS)
      .single();

    data = result.data;
    error = result.error;
  } catch {
    return NextResponse.json({ success: false, message: "Configuration serveur manquante." }, { status: 500 });
  }

  if (error || !data) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  return NextResponse.json({ success: true, product: mapSupabaseProduct(data) });
}

export async function DELETE(request: Request) {
  const body = await request.json() as ManageRequest;
  const productId = cleanText(body.ownership?.productId);
  const sellerPhone = cleanText(body.ownership?.sellerPhone);

  if (!productId || !sellerPhone) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  let error;

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const result = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("phone", sellerPhone);

    error = result.error;
  } catch {
    return NextResponse.json({ success: false, message: "Configuration serveur manquante." }, { status: 500 });
  }

  if (error) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
