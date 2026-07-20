import { cleanText } from "@/lib/validation";
import { permanentRedirect } from "next/navigation";
import { NextResponse } from "next/server";

type QrRedirectRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: QrRedirectRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return NextResponse.redirect(new URL("/stores", _request.url));
  }

  permanentRedirect(`/store/${encodeURIComponent(cleanSlug)}`);
}
