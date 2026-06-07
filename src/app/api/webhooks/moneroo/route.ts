import { NextResponse } from "next/server";
import {
  constructMonerooWebhookEvent,
  verifyMonerooPayment,
  type MonerooVerifiedPayment,
  type MonerooWebhookEvent,
} from "@/lib/moneroo";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OrderPaymentRow = {
  id: string;
  total_amount: number | string | null;
  currency: string | null;
};

type CertificationPaymentRow = {
  id: string;
  store_id: string;
  amount: number | string | null;
  currency: string | null;
  duration_months: number | null;
};

type StoreCertificationRow = {
  certification_expires_at: string | null;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-moneroo-signature") || "";

  if (!signature) {
    return NextResponse.json({ message: "Missing Moneroo signature." }, { status: 400 });
  }

  let event: MonerooWebhookEvent;

  try {
    event = constructMonerooWebhookEvent(rawBody, signature);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid Moneroo webhook." },
      { status: 403 },
    );
  }

  const paymentId = event.data?.id || "";

  if (!paymentId) {
    return NextResponse.json({ received: true });
  }

  try {
    const verifiedPayment = await verifyMonerooPayment(paymentId);
    const paymentStatus = getShopfyPaymentStatus(event, verifiedPayment);

    if (!paymentStatus) {
      return NextResponse.json({ received: true });
    }

    const supabase = createSupabaseAdminClient();

    if (getPaymentKind(event, verifiedPayment) === "store_certification") {
      return handleCertificationPayment(supabase, paymentId, paymentStatus, event, verifiedPayment);
    }

    const { data: order, error: orderError } = await supabase
      .from("shopfy_store_orders")
      .select("id, total_amount, currency")
      .eq("payment_provider", "moneroo")
      .eq("provider_transaction_id", paymentId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ received: true });
    }

    if (paymentStatus === "paid" && !isExpectedPayment(order as OrderPaymentRow, verifiedPayment)) {
      return NextResponse.json({ message: "Moneroo payment amount or currency mismatch." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("shopfy_store_orders")
      .update({
        payment_status: paymentStatus,
        payment_provider: "moneroo",
        payment_reference: verifiedPayment.id || paymentId,
        provider_transaction_id: paymentId,
        paid_at: paymentStatus === "paid" ? now : null,
        payment_error: null,
        updated_at: now,
      })
      .eq("id", order.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Moneroo webhook processing failed." },
      { status: 500 },
    );
  }
}

async function handleCertificationPayment(
  supabase: SupabaseAdminClient,
  paymentId: string,
  paymentStatus: string,
  event: MonerooWebhookEvent,
  verifiedPayment: MonerooVerifiedPayment,
) {
  const metadata = getPaymentMetadata(event, verifiedPayment);
  const certificationPaymentId = cleanMetadataValue(metadata.certification_payment_id);
  const { data: paymentByProvider, error: providerLookupError } = await supabase
    .from("shopfy_store_certification_payments")
    .select("id, store_id, amount, currency, duration_months")
    .eq("provider", "moneroo")
    .eq("provider_payment_id", paymentId)
    .maybeSingle();

  if (providerLookupError) {
    return NextResponse.json({ message: providerLookupError.message }, { status: 500 });
  }

  let certificationPayment = paymentByProvider as CertificationPaymentRow | null;

  if (!certificationPayment && certificationPaymentId) {
    const { data: paymentById, error: idLookupError } = await supabase
      .from("shopfy_store_certification_payments")
      .select("id, store_id, amount, currency, duration_months")
      .eq("id", certificationPaymentId)
      .maybeSingle();

    if (idLookupError) {
      return NextResponse.json({ message: idLookupError.message }, { status: 500 });
    }

    certificationPayment = paymentById as CertificationPaymentRow | null;
  }

  if (!certificationPayment) {
    return NextResponse.json({ received: true });
  }

  if (paymentStatus === "paid" && !isExpectedCertificationPayment(certificationPayment, verifiedPayment)) {
    return NextResponse.json({ message: "Moneroo certification amount or currency mismatch." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error: paymentUpdateError } = await supabase
    .from("shopfy_store_certification_payments")
    .update({
      status: paymentStatus,
      provider_payment_id: paymentId,
      provider_reference: verifiedPayment.id || paymentId,
      paid_at: paymentStatus === "paid" ? now : null,
      updated_at: now,
    })
    .eq("id", certificationPayment.id);

  if (paymentUpdateError) {
    return NextResponse.json({ message: paymentUpdateError.message }, { status: 500 });
  }

  if (paymentStatus !== "paid") {
    return NextResponse.json({ received: true });
  }

  const { data: storeData, error: storeLookupError } = await supabase
    .from("shopfy_stores")
    .select("certification_expires_at")
    .eq("id", certificationPayment.store_id)
    .single();

  if (storeLookupError || !storeData) {
    return NextResponse.json({ message: storeLookupError?.message || "Store not found." }, { status: 500 });
  }

  const durationMonths = Number(certificationPayment.duration_months || 1);
  const baseDate = getCertificationBaseDate((storeData as StoreCertificationRow).certification_expires_at);
  const expiresAt = addMonths(baseDate, durationMonths).toISOString();
  const { error: storeUpdateError } = await supabase
    .from("shopfy_stores")
    .update({
      is_certified: true,
      certification_started_at: now,
      certification_expires_at: expiresAt,
      certification_duration_months: durationMonths,
      certification_amount: Number(certificationPayment.amount || 0),
      updated_at: now,
    })
    .eq("id", certificationPayment.store_id);

  if (storeUpdateError) {
    return NextResponse.json({ message: storeUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function getShopfyPaymentStatus(event: MonerooWebhookEvent, payment: MonerooVerifiedPayment) {
  const eventName = String(event.event || event.type || "").toLowerCase();
  const status = String(payment.status || event.data?.status || "").toLowerCase();

  if (eventName === "payment.success" || status === "success") {
    return "paid";
  }

  if (eventName === "payment.failed" || status === "failed") {
    return "failed";
  }

  if (eventName === "payment.cancelled" || eventName === "payment.canceled" || status === "cancelled" || status === "canceled") {
    return "cancelled";
  }

  return "";
}

function getPaymentKind(event: MonerooWebhookEvent, payment: MonerooVerifiedPayment) {
  return cleanMetadataValue(getPaymentMetadata(event, payment).shopfy_kind);
}

function getPaymentMetadata(event: MonerooWebhookEvent, payment: MonerooVerifiedPayment) {
  return {
    ...(event.data?.metadata || {}),
    ...(payment.metadata || {}),
  };
}

function cleanMetadataValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isExpectedPayment(order: OrderPaymentRow, payment: MonerooVerifiedPayment) {
  const paidAmount = Number(payment.amount || 0);
  const expectedAmount = Number(order.total_amount || 0);
  const paidCurrency = getPaymentCurrency(payment);
  const expectedCurrency = (order.currency || "XOF").toUpperCase();

  return paidAmount >= expectedAmount && paidCurrency === expectedCurrency;
}

function isExpectedCertificationPayment(certificationPayment: CertificationPaymentRow, payment: MonerooVerifiedPayment) {
  const paidAmount = Number(payment.amount || 0);
  const expectedAmount = Number(certificationPayment.amount || 0);
  const paidCurrency = getPaymentCurrency(payment);
  const expectedCurrency = (certificationPayment.currency || "XOF").toUpperCase();

  return paidAmount >= expectedAmount && paidCurrency === expectedCurrency;
}

function getPaymentCurrency(payment: MonerooVerifiedPayment) {
  if (typeof payment.currency === "string") {
    return payment.currency.toUpperCase();
  }

  return (payment.currency?.code || payment.currency?.symbol || "XOF").toUpperCase();
}

function getCertificationBaseDate(currentExpiration?: string | null) {
  const now = new Date();
  const currentExpirationDate = currentExpiration ? new Date(currentExpiration) : null;

  if (currentExpirationDate && currentExpirationDate.getTime() > now.getTime()) {
    return currentExpirationDate;
  }

  return now;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + Math.max(1, Math.trunc(months)));
  return result;
}
