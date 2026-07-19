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
};

type OrderForStatusUpdateRow = {
  id: string;
  status: string | null;
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

    const { data: currentOrderData, error: currentOrderError } = await supabase
      .from("shopfy_store_orders")
      .select("id, status, shopfy_store_order_items (product_id, quantity)")
      .eq("id", cleanOrderId)
      .eq("store_id", storeData.id)
      .single();

    if (currentOrderError || !currentOrderData) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    const currentOrder = currentOrderData as OrderForStatusUpdateRow;

    if (currentOrder.status === "confirmed") {
      return NextResponse.json({ message: "Une vente confirmee ne peut plus etre modifiee." }, { status: 409 });
    }

    if (currentOrder.status === "cancelled") {
      return NextResponse.json({ message: "Une commande annulee ne peut plus etre modifiee." }, { status: 409 });
    }

    if (nextStatus === "confirmed") {
      const stockError = await decrementOrderStock(supabase, storeData.id, currentOrder);

      if (stockError) {
        return NextResponse.json({ message: stockError }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("shopfy_store_orders")
      .update({
        status: nextStatus,
        confirmed_at: nextStatus === "confirmed" ? new Date().toISOString() : null,
        cancelled_at: nextStatus === "cancelled" ? new Date().toISOString() : null,
        action_user_id: authData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cleanOrderId)
      .eq("store_id", storeData.id)
      .select(ORDER_SELECT_FIELDS)
      .single();

    if (error || !data) {
      if (nextStatus === "confirmed") {
        await restoreOrderStock(supabase, storeData.id, currentOrder);
      }
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
      .select("id, status")
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

async function decrementOrderStock(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  storeId: string,
  order: OrderForStatusUpdateRow,
) {
  const decrementedItems: OrderForStatusUpdateRow["shopfy_store_order_items"] = [];

  for (const item of order.shopfy_store_order_items || []) {
    if (!item.product_id || !item.quantity) {
      continue;
    }

    const quantity = Number(item.quantity || 0);
    const { data: productData, error: productError } = await supabase
      .from("shopfy_store_products")
      .select("inventory_quantity")
      .eq("store_id", storeId)
      .eq("id", item.product_id)
      .single();

    if (productError || !productData) {
      await restoreOrderStock(supabase, storeId, { ...order, shopfy_store_order_items: decrementedItems });
      return "Product not found.";
    }

    const currentInventory = Number(productData.inventory_quantity || 0);

    if (currentInventory < quantity) {
      await restoreOrderStock(supabase, storeId, { ...order, shopfy_store_order_items: decrementedItems });
      return "Stock insuffisant pour confirmer cette vente.";
    }

    const { error: updateError } = await supabase
      .from("shopfy_store_products")
      .update({
        inventory_quantity: currentInventory - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeId)
      .eq("id", item.product_id);

    if (updateError) {
      await restoreOrderStock(supabase, storeId, { ...order, shopfy_store_order_items: decrementedItems });
      return updateError.message;
    }

    decrementedItems.push(item);
  }

  return "";
}

async function restoreOrderStock(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  storeId: string,
  order: OrderForStatusUpdateRow,
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
