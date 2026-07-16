import { NextResponse } from "next/server";
import { mapOrderRow, ORDER_SELECT_FIELDS, type OrderRow } from "@/lib/orderRows";
import { createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import { cleanText, hasUnsafeObjectKeys } from "@/lib/validation";
import type { StoreOrderStatus } from "@/types/storefront";

type StoreOrderRouteContext = {
  params: Promise<{
    slug: string;
    orderId: string;
  }>;
};

type UpdateOrderRequest = {
  status?: StoreOrderStatus;
};

export async function PATCH(request: Request, context: StoreOrderRouteContext) {
  const { slug, orderId } = await context.params;
  const cleanSlug = cleanText(slug);
  const cleanOrderId = cleanText(orderId);
  const body = (await request.json().catch(() => ({}))) as UpdateOrderRequest;

  if (hasUnsafeObjectKeys(body)) {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const nextStatus = body.status === "cancelled" ? "cancelled" : "confirmed";

  if (!cleanSlug || !cleanOrderId) {
    return NextResponse.json({ message: "Store and order are required." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, owner_user_id")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez modifier que vos propres commandes." }, { status: 403 });
    }

    if (nextStatus === "confirmed") {
      const { data: currentOrder, error: currentOrderError } = await supabase
        .from("shopfy_store_orders")
        .select("payment_status")
        .eq("id", cleanOrderId)
        .eq("store_id", storeData.id)
        .single();

      if (currentOrderError || !currentOrder) {
        return NextResponse.json({ message: "Order not found." }, { status: 404 });
      }

      // No external online payment providers are used; proceed to confirm the order.
    }

    const { data, error } = await supabase
      .from("shopfy_store_orders")
      .update({
        status: nextStatus,
        confirmed_at: nextStatus === "confirmed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cleanOrderId)
      .eq("store_id", storeData.id)
      .select(ORDER_SELECT_FIELDS)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message || "Order update failed." }, { status: error?.code === "42501" ? 403 : 500 });
    }

    return NextResponse.json({ order: mapOrderRow(data as OrderRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
