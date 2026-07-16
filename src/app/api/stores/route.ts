import { NextResponse } from "next/server";
import { createStoreSlug, type CreateStoreInput } from "@/lib/createdStores";
import { createSupabaseRequestClient, createSupabaseServerClient } from "@/lib/supabaseAdmin";
import { mapStoreRow, STORE_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import { cleanImage, cleanText, hasUnsafeObjectKeys } from "@/lib/validation";
import {
  getInternationalWhatsappPhoneError,
  isValidWhatsappPhone,
  normalizeWhatsappPhone,
} from "@/lib/whatsapp";

const fallbackLogoUrl = "https://images.unsplash.com/photo-1521566652839-697aa473761a?auto=format&fit=crop&w=400&q=80";
const fallbackBannerUrl = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const onlyMine = url.searchParams.get("mine") === "true";
  const supabase = createSupabaseRequestClient(request);
    let ownerUserId = "";

    if (onlyMine) {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        return NextResponse.json({ stores: [], message: "Authentication required." }, { status: 401 });
      }

      ownerUserId = authData.user.id;
    }

    let query = supabase
      .from("shopfy_stores")
      .select(STORE_SELECT_FIELDS)
      .order("created_at", { ascending: false });

    if (onlyMine) {
      query = query.eq("owner_user_id", ownerUserId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ stores: [], message: error.message }, { status: 500 });
    }

    return NextResponse.json({ stores: ((data || []) as StoreRow[]).map(mapStoreRow) });
  } catch {
    return NextResponse.json({ stores: [], message: "Missing Supabase server configuration." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<CreateStoreInput>;

  if (hasUnsafeObjectKeys(body)) {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const name = cleanText(body.name);
  const ownerName = cleanText(body.ownerName);
  const city = cleanText(body.city);
  const country = cleanText(body.country, "Benin");
  const currency = cleanText(body.currency, "XOF").toUpperCase();
  const whatsappPhone = normalizeWhatsappPhone(cleanText(body.whatsappPhone));
  const category = cleanText(body.category, "General");
  const slug = createStoreSlug(name);
  const allowedCurrencies = new Set(["XOF", "USD", "EUR", "GBP", "CAD"]);

  if (!name || !ownerName || !city || !country || !whatsappPhone) {
    return NextResponse.json({ message: "Store name, owner, city, country, and WhatsApp are required." }, { status: 400 });
  }

  if (!isValidWhatsappPhone(whatsappPhone)) {
    return NextResponse.json({ message: getInternationalWhatsappPhoneError() }, { status: 400 });
  }

  if (!allowedCurrencies.has(currency)) {
    return NextResponse.json({ message: "Unsupported currency." }, { status: 400 });
  }

  const payload = {
    owner_user_id: "",
    slug,
    name,
    tagline: cleanText(body.tagline) || `Boutique ${category.toLowerCase()} creee avec Shopfy.`,
    description: cleanText(body.description) || "Une boutique vendeur neutre creee sur Shopfy.",
    logo_url: cleanImage(body.logoUrl) || fallbackLogoUrl,
    banner_url: cleanImage(body.bannerUrl) || fallbackBannerUrl,
    owner_name: ownerName,
    city,
    country,
    currency,
    whatsapp_phone: whatsappPhone,
  };

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Connectez-vous pour creer une boutique." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("shopfy_stores")
      .insert({ ...payload, owner_user_id: authData.user.id })
      .select(STORE_SELECT_FIELDS)
      .single();

    if (error || !data) {
      const status = error?.code === "23505"
        ? 409
        : error?.code === "42501"
        ? 403
        : 500;
      return NextResponse.json({ message: error?.message || "Store creation failed." }, { status });
    }

    return NextResponse.json({ store: mapStoreRow(data as StoreRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
