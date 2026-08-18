import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StoresDirectory } from "@/components/store/StoresDirectory";
import { createSupabaseAnonClient } from "@/lib/supabaseAdmin";
import { demoStores } from "@/lib/demoStores";
import { mapStoreRow, STORE_LIST_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import { cleanText } from "@/lib/validation";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE_KEY } from "@/lib/languageConfig";
import type { ShopfyStore } from "@/types/storefront";

export const metadata = {
  title: "Seller stores - Shopfy",
  description: "Discover seller stores created on Shopfy.",
};

type StoresPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = cleanText(resolvedSearchParams?.q || "");
  const cookiesStore = await cookies();
  const languageCookie = cookiesStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const language = isLanguage(languageCookie) ? languageCookie : DEFAULT_LANGUAGE;
  const stores = await getPublicStores();

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <StoresDirectory stores={stores} query={query} language={language} />
      <Footer />
    </main>
  );
}

async function getPublicStores(): Promise<ShopfyStore[]> {
  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
      .from("shopfy_stores")
      .select(STORE_LIST_SELECT_FIELDS)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data) {
      return demoStores;
    }

    return (data as StoreRow[]).map(mapStoreRow);
  } catch {
    return demoStores;
  }
}
