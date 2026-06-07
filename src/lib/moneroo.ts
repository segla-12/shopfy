import { createHmac, timingSafeEqual } from "crypto";

type MonerooCustomerInput = {
  name: string;
  email: string;
  phone?: string;
};

type MonerooOrderPaymentInput = {
  orderId: string;
  storeSlug: string;
  storeName: string;
  amount: number;
  currency: string;
  customer: MonerooCustomerInput;
};

type MonerooStoreCertificationPaymentInput = {
  certificationPaymentId: string;
  storeSlug: string;
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  amount: number;
  currency: string;
  durationMonths: number;
};

type MonerooPaymentResult = {
  transactionId: string;
  reference: string;
  paymentUrl: string;
};

type MonerooInitializeResponse = {
  id?: string;
  checkout_url?: string;
};

export type MonerooVerifiedPayment = {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string | { code?: string; symbol?: string };
  metadata?: Record<string, string>;
};

export type MonerooWebhookEvent = {
  event?: string;
  type?: string;
  data?: {
    id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    metadata?: Record<string, string>;
  };
  [key: string]: unknown;
};

const monerooApiBaseUrl = "https://api.moneroo.io/v1";
const defaultCustomerEmailDomain = "shopfy.site";

export function isMonerooConfigured() {
  return Boolean(process.env.MONEROO_SECRET_KEY);
}

export function getMonerooWebhookUrl() {
  return `${getAppUrl()}/api/webhooks/moneroo`;
}

export function constructMonerooWebhookEvent(rawBody: string, signature: string) {
  const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing Moneroo webhook secret.");
  }

  verifyMonerooSignature(rawBody, signature, webhookSecret);

  return JSON.parse(rawBody) as MonerooWebhookEvent;
}

export async function createMonerooOrderPayment(input: MonerooOrderPaymentInput): Promise<MonerooPaymentResult> {
  const [firstName, ...lastNameParts] = input.customer.name.trim().split(/\s+/u);
  const payment = await monerooRequest<MonerooInitializeResponse>("payments/initialize", {
    method: "POST",
    body: {
      amount: Math.trunc(input.amount),
      currency: input.currency || "XOF",
      description: `Shopfy order ${input.orderId.slice(0, 8)} - ${input.storeName}`,
      return_url: `${getAppUrl()}/store/${encodeURIComponent(input.storeSlug)}?payment=moneroo&order=${encodeURIComponent(input.orderId)}`,
      customer: {
        email: normalizeCustomerEmail(input.customer.email, input.customer.phone || input.orderId),
        first_name: firstName || "Client",
        last_name: lastNameParts.join(" ") || "Shopfy",
        phone: input.customer.phone || undefined,
      },
      metadata: {
        shopfy_kind: "store_order",
        order_id: input.orderId,
        store_slug: input.storeSlug,
      },
    },
  });

  if (!payment.id || !payment.checkout_url) {
    throw new Error("Moneroo did not return a checkout link.");
  }

  return {
    transactionId: payment.id,
    reference: payment.id,
    paymentUrl: payment.checkout_url,
  };
}

export async function createMonerooStoreCertificationPayment(
  input: MonerooStoreCertificationPaymentInput,
): Promise<MonerooPaymentResult> {
  const customerName = input.ownerName.trim() || "Vendeur Shopfy";
  const [firstName, ...lastNameParts] = customerName.split(/\s+/u);
  const payment = await monerooRequest<MonerooInitializeResponse>("payments/initialize", {
    method: "POST",
    body: {
      amount: Math.trunc(input.amount),
      currency: input.currency || "XOF",
      description: `Shopfy certification ${input.durationMonths} mois - ${input.storeName}`,
      return_url: `${getAppUrl()}/dashboard?certification=moneroo&store=${encodeURIComponent(input.storeSlug)}`,
      customer: {
        email: normalizeCustomerEmail(input.ownerEmail, input.ownerPhone || input.storeSlug),
        first_name: firstName || "Vendeur",
        last_name: lastNameParts.join(" ") || "Shopfy",
        phone: input.ownerPhone || undefined,
      },
      metadata: {
        shopfy_kind: "store_certification",
        certification_payment_id: input.certificationPaymentId,
        store_slug: input.storeSlug,
        duration_months: String(input.durationMonths),
      },
    },
  });

  if (!payment.id || !payment.checkout_url) {
    throw new Error("Moneroo did not return a checkout link.");
  }

  return {
    transactionId: payment.id,
    reference: payment.id,
    paymentUrl: payment.checkout_url,
  };
}

export async function verifyMonerooPayment(paymentId: string) {
  return monerooRequest<MonerooVerifiedPayment>(`payments/${encodeURIComponent(paymentId)}/verify`, {
    method: "GET",
  });
}

async function monerooRequest<T extends object>(path: string, options: { method: "GET" | "POST"; body?: unknown }) {
  const secretKey = process.env.MONEROO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing Moneroo secret key.");
  }

  const response = await fetch(`${monerooApiBaseUrl}/${path.replace(/^\/+/u, "")}`, {
    method: options.method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(getMonerooErrorMessage(payload) || `Moneroo request failed with status ${response.status}.`);
  }

  return unwrapMonerooPayload<T>(payload);
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://shopfy.site")
    .replace(/^([^:]+)$/u, "https://$1")
    .replace(/\/+$/u, "");
}

function normalizeCustomerEmail(email: string, phone: string) {
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.includes("@")) {
    return trimmedEmail;
  }

  const phoneDigits = phone.replace(/\D/gu, "");
  return `client-${phoneDigits || Date.now()}@${defaultCustomerEmailDomain}`;
}

function verifyMonerooSignature(rawBody: string, signatureHeader: string, secret: string) {
  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (!secureCompare(signatureHeader, expectedSignature)) {
    throw new Error("Invalid Moneroo webhook signature.");
  }
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function unwrapMonerooPayload<T extends object>(payload: Record<string, unknown>) {
  return (payload.data || payload) as T;
}

function getMonerooErrorMessage(payload: Record<string, unknown>) {
  const message = payload.message || payload.error || payload.errors;

  if (typeof message === "string") {
    return message;
  }

  return "";
}
