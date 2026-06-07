import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StorefrontResolver } from "@/components/store/StorefrontResolver";
import { getDemoStore } from "@/lib/demoStores";
import { createSupabaseServerClient } from "@/lib/supabaseAdmin";
import { mapStoreRow, STORE_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import { cleanText } from "@/lib/validation";
import type { ShopfyStore } from "@/types/storefront";
import { connection } from "next/server";

type StorePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await getPublicStore(slug);

  if (!store) {
    return {
      title: "Store not found - Shopfy",
    };
  }

  return {
    title: `${store.name} - Shopfy Store`,
    description: store.description,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  await connection();

  const { slug } = await params;
  const store = await getPublicStore(slug);

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <StorefrontResolver slug={slug} initialStore={store} />
      <Footer />
    </main>
  );
}

async function getPublicStore(slug: string): Promise<ShopfyStore | null> {
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("shopfy_stores")
      .select(STORE_SELECT_FIELDS)
      .eq("slug", cleanSlug)
      .single();

    if (!error && data) {
      return mapStoreRow(data as StoreRow);
    }
  } catch {
    // The public page should still be able to render local demo stores without Supabase.
  }

  return getDemoStore(cleanSlug);
}
