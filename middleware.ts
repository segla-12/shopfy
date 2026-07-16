import { NextRequest, NextResponse } from "next/server";

const authCookieName = "shopfy_session";
const protectedPaths = ["/dashboard", "/create-store", "/sell"];
const apiRateLimitWindowMs = 60_000;
const apiRateLimitMax = 120;
const abusiveRateLimitMax = 240;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(authCookieName)?.value);

  if (pathname.startsWith("/auth") && hasSession) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return withSecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  if (protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (!hasSession) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  if (pathname.startsWith("/api/")) {
    const limitedResponse = applyApiRateLimit(request);

    if (limitedResponse) {
      return withSecurityHeaders(limitedResponse);
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

function applyApiRateLimit(request: NextRequest) {
  const now = Date.now();
  // NOTE: Ce rate-limiting en mémoire est inefficace en environnement serverless.
  // Une solution externe (ex: Upstash, Vercel KV) est nécessaire pour la production.
  const userId = request.cookies.get("shopfy_user_id")?.value;
  const identifier = userId || getClientIp(request);
  const key = `${identifier}:${request.nextUrl.pathname}`;
  const bucket = rateLimitBuckets.get(key);

  if (bucket?.blockedUntil && bucket.blockedUntil > now) {
    return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 });
  }

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + apiRateLimitWindowMs });
    return null;
  }

  bucket.count += 1;

  if (bucket.count > abusiveRateLimitMax) {
    bucket.blockedUntil = now + apiRateLimitWindowMs * 10;
    console.warn("[security] Temporarily blocked abusive API traffic.", {
      identifier,
      path: request.nextUrl.pathname,
      count: bucket.count,
    });
    return NextResponse.json({ message: "Request blocked." }, { status: 429 });
  }

  if (bucket.count > apiRateLimitMax) { // Log standard pour le rate limiting normal
    console.warn("[security] API rate limit exceeded.", {
      identifier,
      path: request.nextUrl.pathname,
      count: bucket.count,
    });
    return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 });
  }

  return null;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon-shopfy.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
