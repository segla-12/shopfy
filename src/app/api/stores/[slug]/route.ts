import { NextResponse } from "next/server";
import { createSupabaseRequestClient, createSupabaseServerClient } from "@/lib/supabaseAdmin";
import { mapStoreRow, STORE_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import { cleanImage, cleanText, hasUnsafeObjectKeys } from "@/lib/validation";
import { isValidWhatsappPhone, normalizeWhatsappPhone } from "@/lib/whatsapp";

type StoreRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: StoreRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return NextResponse.json({ message: "Missing store slug." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("shopfy_stores")
      .select(STORE_SELECT_FIELDS)
      .eq("slug", cleanSlug)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({ store: mapStoreRow(data as StoreRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: StoreRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);
  const body = (await request.json().catch(() => ({}))) as {
    store?: {
      name?: string;
      tagline?: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
      ownerName?: string;
      city?: string;
      country?: string;
      currency?: string;
      whatsappPhone?: string;
      primaryColor?: string;
      accentColor?: string;
    };
  };

  if (hasUnsafeObjectKeys(body)) {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!cleanSlug || !body.store) {
    return NextResponse.json({ message: "Missing store." }, { status: 400 });
  }

  const whatsappPhone = normalizeWhatsappPhone(cleanText(body.store.whatsappPhone));

  if (body.store.whatsappPhone !== undefined && !isValidWhatsappPhone(whatsappPhone)) {
    return NextResponse.json({ message: "Numero WhatsApp invalide." }, { status: 400 });
  }

  const payload = {
    ...(body.store.name !== undefined ? { name: cleanText(body.store.name) } : {}),
    ...(body.store.tagline !== undefined ? { tagline: cleanText(body.store.tagline) } : {}),
    ...(body.store.description !== undefined ? { description: cleanText(body.store.description) } : {}),
    ...(body.store.logoUrl !== undefined ? { logo_url: cleanImage(body.store.logoUrl) || cleanText(body.store.logoUrl) } : {}),
    ...(body.store.bannerUrl !== undefined ? { banner_url: cleanImage(body.store.bannerUrl) || cleanText(body.store.bannerUrl) } : {}),
    ...(body.store.ownerName !== undefined ? { owner_name: cleanText(body.store.ownerName) } : {}),
    ...(body.store.city !== undefined ? { city: cleanText(body.store.city) } : {}),
    ...(body.store.country !== undefined ? { country: cleanText(body.store.country, "Benin") } : {}),
    ...(body.store.currency !== undefined ? { currency: cleanText(body.store.currency, "XOF").toUpperCase() } : {}),
    ...(body.store.whatsappPhone !== undefined ? { whatsapp_phone: whatsappPhone } : {}),
    ...(body.store.primaryColor !== undefined ? { primary_color: cleanText(body.store.primaryColor) } : {}),
    ...(body.store.accentColor !== undefined ? { accent_color: cleanText(body.store.accentColor) } : {}),
  };

  if ("name" in payload && !payload.name) {
    return NextResponse.json({ message: "Store name is required." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Connectez-vous pour modifier la boutique." }, { status: 401 });
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
      .from("shopfy_stores")
      .update(payload)
      .eq("id", storeData.id)
      .select(STORE_SELECT_FIELDS)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message || "Store update failed." }, { status: error?.code === "42501" ? 403 : 500 });
    }

    return NextResponse.json({ store: mapStoreRow(data as StoreRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
