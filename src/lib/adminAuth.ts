import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SECRET_HEADER = "x-shopfy-admin-secret";
export const ADMIN_SESSION_COOKIE = "shopfy_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 2;

export function isValidAdminSecret(secret?: string | null) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || !secret) {
    return false;
  }

  const expected = Buffer.from(adminSecret);
  const received = Buffer.from(secret);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function getAdminSecretFromRequest(request: Request) {
  if (isValidAdminSession(getCookieValue(request, ADMIN_SESSION_COOKIE))) {
    return process.env.ADMIN_SECRET || "";
  }

  return request.headers.get(ADMIN_SECRET_HEADER) || "";
}

export function createAdminSessionCookieValue() {
  const issuedAt = Date.now();
  return `${issuedAt}.${signAdminSession(String(issuedAt))}`;
}

export function isValidAdminSession(value?: string | null) {
  if (!value) {
    return false;
  }

  const [issuedAt, signature] = value.split(".");
  const issuedAtNumber = Number(issuedAt);

  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) {
    return false;
  }

  if (Date.now() - issuedAtNumber > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) {
    return false;
  }

  const expected = Buffer.from(signAdminSession(issuedAt));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function getAdminSessionMaxAgeSeconds() {
  return ADMIN_SESSION_MAX_AGE_SECONDS;
}

function signAdminSession(value: string) {
  const secret = process.env.ADMIN_SECRET || "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
