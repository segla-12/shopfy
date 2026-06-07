import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanText } from "@/lib/validation";

type CertificationRequest = {
  adminSecret?: string;
  productId?: string;
  storeSlug?: string;
  isCertified?: boolean;
  certificationStartDate?: string;
  durationMonths?: number;
};

const CERTIFICATION_PRICE_PER_MONTH = 1500;

export async function POST(request: Request) {
  const body = await request.json() as CertificationRequest;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || body.adminSecret !== adminSecret) {
    return NextResponse.json(
      { success: false, message: "Admin access denied." },
      { status: 401 },
    );
  }

  const productId = cleanText(body.productId);
  const storeSlug = cleanText(body.storeSlug);

  if ((!productId && !storeSlug) || typeof body.isCertified !== "boolean") {
    if (!productId && !storeSlug && typeof body.isCertified === "undefined") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: "Incomplete request." },
      { status: 400 },
    );
  }

  if (productId && storeSlug) {
    return NextResponse.json(
      { success: false, message: "Incomplete request." },
      { status: 400 },
    );
  }

  const durationMonths = normalizeDurationMonths(body.durationMonths);
  const certificationStartedAt = getCertificationStartDate(body.certificationStartDate);
  const certificationExpiresAt = addMonths(certificationStartedAt, durationMonths);
  const certificationAmount = durationMonths * CERTIFICATION_PRICE_PER_MONTH;
  const certificationUpdate = body.isCertified
    ? {
        is_certified: true,
        certification_started_at: certificationStartedAt.toISOString(),
        certification_expires_at: certificationExpiresAt.toISOString(),
        certification_duration_months: durationMonths,
        certification_amount: certificationAmount,
      }
    : {
        is_certified: false,
        certification_started_at: null,
        certification_expires_at: null,
        certification_duration_months: null,
        certification_amount: null,
      };

  let error;
  let usedFallback = false;

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const tableName = storeSlug ? "shopfy_stores" : "products";
    const columnName = storeSlug ? "slug" : "id";
    const entityId = storeSlug || productId;
    let result = await supabaseAdmin
      .from(tableName)
      .update(certificationUpdate)
      .eq(columnName, entityId);

    error = result.error;

    if (error) {
      result = await supabaseAdmin
        .from(tableName)
        .update({ is_certified: body.isCertified })
        .eq(columnName, entityId);

      error = result.error;
      usedFallback = !error;
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Missing server configuration." },
      { status: 500 },
    );
  }

  if (error) {
    return NextResponse.json(
      { success: false, message: "Certification failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    certification: body.isCertified
      ? {
          startedAt: certificationStartedAt.toISOString(),
          expiresAt: certificationExpiresAt.toISOString(),
          durationMonths,
          amount: certificationAmount,
        }
      : null,
    message: usedFallback
      ? "Certification updated, but the date columns are missing in Supabase."
      : undefined,
  });
}

function normalizeDurationMonths(durationMonths?: number) {
  if (!Number.isFinite(durationMonths)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(Number(durationMonths)), 1), 12);
}

function getCertificationStartDate(date?: string) {
  if (!date) {
    return new Date();
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
