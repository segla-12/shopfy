import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import { cleanText } from "@/lib/validation";

export const runtime = "nodejs";

const CERTIFICATION_PRICE_PER_MONTH = 1500;
const CERTIFICATION_CURRENCY = "XOF";
const allowedDurations = [1, 2, 3, 6, 12];

type StoreCertificationRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type CertificationRequestBody = {
  durationMonths?: number;
};

type StoreForCertificationRow = {
  id: string;
  slug: string;
  name: string;
  owner_name: string | null;
  owner_user_id: string | null;
  whatsapp_phone: string | null;
};

export async function POST(request: Request, context: StoreCertificationRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);
  const body = (await request.json().catch(() => ({}))) as CertificationRequestBody;
  const durationMonths = getCertificationDuration(body.durationMonths);
  const amount = CERTIFICATION_PRICE_PER_MONTH * durationMonths;

  if (!cleanSlug) {
    return NextResponse.json({ message: "Boutique manquante." }, { status: 400 });
  }

  // Online certification payments removed. Use manual process via Shopfy.

  try {
    const requestSupabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await requestSupabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Connectez-vous pour activer votre boutique." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, slug, name, owner_name, owner_user_id, whatsapp_phone")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Boutique introuvable." }, { status: 404 });
    }

    const store = storeData as StoreForCertificationRow;

    if (store.owner_user_id !== authData.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez activer que votre propre boutique." }, { status: 403 });
    }

    const now = new Date().toISOString();
    // Create a manual certification request record so Shopfy team can follow up.
    const { data: paymentRow, error: paymentInsertError } = await supabase
      .from("shopfy_store_certification_payments")
      .insert({
        store_id: store.id,
        provider: "manual",
        status: "pending",
        amount,
        currency: CERTIFICATION_CURRENCY,
        duration_months: durationMonths,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (paymentInsertError || !paymentRow) {
      return NextResponse.json(
        { message: paymentInsertError?.message || "Impossible de preparer la demande d'activation." },
        { status: 500 },
      );
    }

    // Respond with instruction: Shopfy team will contact the owner to arrange manual payment.
    return NextResponse.json({
      message: "Demande d'activation enregistree. Lequipe Shopfy contactera le vendeur pour finaliser la procedure.",
    });
  } catch {
    return NextResponse.json({ message: "Configuration Supabase manquante." }, { status: 500 });
  }
}

function getCertificationDuration(durationMonths?: number) {
  const requestedDuration = Number(durationMonths || 1);

  if (allowedDurations.includes(requestedDuration)) {
    return requestedDuration;
  }

  return 1;
}
