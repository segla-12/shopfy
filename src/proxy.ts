import { NextResponse, type NextRequest } from "next/server";

const securedDashboardPaths = ["/dashboard", "/admin"];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (securedDashboardPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
