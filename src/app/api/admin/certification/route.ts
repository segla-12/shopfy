import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanText } from "@/lib/validation";

type CertificationRequest = {
  adminSecret?: string;
  productId?: string;
  isCertified?: boolean;
};

export async function POST(request: Request) {
  const body = await request.json() as CertificationRequest;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || body.adminSecret !== adminSecret) {
    return NextResponse.json(
      { success: false, message: "Acces admin refuse." },
      { status: 401 },
    );
  }

  const productId = cleanText(body.productId);

  if (!productId || typeof body.isCertified !== "boolean") {
    if (!productId && typeof body.isCertified === "undefined") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: "Requete incomplete." },
      { status: 400 },
    );
  }

  let error;

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const result = await supabaseAdmin
      .from("products")
      .update({ is_certified: body.isCertified })
      .eq("id", productId);

    error = result.error;
  } catch {
    return NextResponse.json(
      { success: false, message: "Configuration serveur manquante." },
      { status: 500 },
    );
  }

  if (error) {
    return NextResponse.json(
      { success: false, message: "Certification impossible." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
