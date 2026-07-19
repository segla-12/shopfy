import { NextResponse } from "next/server";
import { mapOrderRow, ORDER_SELECT_FIELDS, type OrderRow } from "@/lib/orderRows";
import { createSupabaseAdminClient, createSupabaseRequestClient } from "@/lib/supabaseAdmin";
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

type OrderForDeleteRow = {
  id: string;
  status: string | null;
  stock_reserved?: boolean | null;
  shopfy_store_order_items?: {
    product_id: string | null;
    quantity: number | null;
  }[];
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

    await refreshStoreSalesStats(supabase, storeData.id);

    return NextResponse.json({ order: mapOrderRow(data as OrderRow) });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: StoreOrderRouteContext) {
  const { slug, orderId } = await context.params;
  const cleanSlug = cleanText(slug);
  const cleanOrderId = cleanText(orderId);

  if (!cleanSlug || !cleanOrderId) {
    return NextResponse.json({ message: "Store and order are required." }, { status: 400 });
  }

  try {
    const requestSupabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await requestSupabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
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

    const { data: orderData, error: orderError } = await supabase
      .from("shopfy_store_orders")
      .select("id, status, stock_reserved, shopfy_store_order_items (product_id, quantity)")
      .eq("id", cleanOrderId)
      .eq("store_id", storeData.id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    const order = orderData as OrderForDeleteRow;

    if (order.status === "confirmed") {
      return NextResponse.json({ message: "Les ventes confirmees ne peuvent pas etre supprimees." }, { status: 409 });
    }

    if (order.stock_reserved) {
      await restoreReservedStock(supabase, storeData.id, order);
    }

    const { error: deleteError } = await supabase
      .from("shopfy_store_orders")
      .delete()
      .eq("id", cleanOrderId)
      .eq("store_id", storeData.id)
      .neq("status", "confirmed");

    if (deleteError) {
      return NextResponse.json({ message: deleteError.message }, { status: deleteError.code === "42501" ? 403 : 500 });
    }

    await refreshStoreSalesStats(supabase, storeData.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}

async function restoreReservedStock(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  storeId: string,
  order: OrderForDeleteRow,
) {
  for (const item of order.shopfy_store_order_items || []) {
    if (!item.product_id || !item.quantity) {
      continue;
    }

    const { data } = await supabase
      .from("shopfy_store_products")
      .select("inventory_quantity")
      .eq("store_id", storeId)
      .eq("id", item.product_id)
      .single();

    await supabase
      .from("shopfy_store_products")
      .update({
        inventory_quantity: Number(data?.inventory_quantity || 0) + Number(item.quantity || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeId)
      .eq("id", item.product_id);
  }
}

async function refreshStoreSalesStats(
  supabase: ReturnType<typeof createSupabaseRequestClient> | ReturnType<typeof createSupabaseAdminClient>,
  storeId: string,
) {
  const { data } = await supabase
    .from("shopfy_store_orders")
    .select("total_amount")
    .eq("store_id", storeId)
    .eq("status", "confirmed");
  const confirmedOrders = data || [];
  const revenue = confirmedOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0);

  await supabase
    .from("shopfy_stores")
    .update({
      orders_count: confirmedOrders.length,
      revenue_amount: revenue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);
}
