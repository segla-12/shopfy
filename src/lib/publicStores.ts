import { demoStores } from "@/lib/demoStores";
import { createSupabaseAnonClient } from "@/lib/supabaseAdmin";
import { mapStoreRow, STORE_LIST_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import type { ShopfyStore } from "@/types/storefront";

const permanentShopfyStore: ShopfyStore = {
  slug: "shopfy-official",
  name: "Shopfy",
  tagline: "La boutique officielle de la marketplace Shopfy",
  description: "Découvrez Shopfy, la boutique officielle de la marketplace.",
  logoUrl: "/SHO.jpg",
  bannerUrl: "/SHO.jpg",
  ownerName: "Shopfy",
  city: "",
  country: "",
  currency: "XOF",
  isCertified: true,
  theme: { primary: "#111827", accent: "#f97316" },
  products: [],
  stats: { products: 0, orders: 0, revenue: 0, conversionRate: 0 },
};

function pinShopfyStore(stores: ShopfyStore[]): ShopfyStore[] {
  return [permanentShopfyStore, ...stores.filter((store) => store.slug !== permanentShopfyStore.slug)];
}

export async function getPublicStores(): Promise<ShopfyStore[]> {
  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
      .from("shopfy_stores")
      .select(STORE_LIST_SELECT_FIELDS)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data) {
      return pinShopfyStore(demoStores);
    }

    return pinShopfyStore((data as StoreRow[]).map(mapStoreRow));
  } catch {
    return pinShopfyStore(demoStores);
  }
}
