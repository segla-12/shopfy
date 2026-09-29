import { demoStores } from "@/lib/demoStores";
import { createSupabaseAnonClient } from "@/lib/supabaseAdmin";
import { mapStoreRow, STORE_LIST_SELECT_FIELDS, type StoreRow } from "@/lib/storeRows";
import type { ShopfyStore } from "@/types/storefront";

export async function getPublicStores(): Promise<ShopfyStore[]> {
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