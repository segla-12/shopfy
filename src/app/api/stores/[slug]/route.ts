import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseAdmin";
import { mapStoreRow, STORE_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import { cleanText } from "@/lib/validation";

type StoreRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: StoreRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return NextResponse.json({ message: "Missing store slug." }, { status: 400 });
  }

  try {
    const supabaseAdmin = createSupabaseServerClient();
    const { data, error } = await supabaseAdmin
      .from("shopfy_stores")
      .select(STORE_SELECT_FIELDS)
      .eq("slug", cleanSlug)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({ store: mapStoreRow(data as StoreRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
