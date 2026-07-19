import type { StoreOrder, StoreOrderItem, StoreOrderStatus, StorePaymentStatus } from "@/types/storefront";

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  title: string;
  quantity: number | null;
  unit_price: number | string | null;
  total_price: number | string | null;
  currency: string | null;
};

export type OrderRow = {
  id: string;
  status: string | null;
  payment_status?: string | null;
  total_amount: number | string | null;
  currency: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  seller_comment?: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at?: string | null;
  action_user_id?: string | null;
  shopfy_stores?: {
    slug: string;
  } | {
    slug: string;
  }[] | null;
  shopfy_store_order_items?: OrderItemRow[];
};

export const ORDER_SELECT_FIELDS = `
  id,
  status,
  payment_status,
  total_amount,
  currency,
  customer_name,
  customer_phone,
  customer_email,
  seller_comment,
  created_at,
  confirmed_at,
  cancelled_at,
  action_user_id,
  shopfy_stores (
    slug
  ),
  shopfy_store_order_items (
    id,
    product_id,
    title,
    quantity,
    unit_price,
    total_price,
    currency
  )
`;

function mapOrderStatus(status: string | null): StoreOrderStatus {
  if (status === "confirmed" || status === "cancelled") {
    return status;
  }

  return "pending";
}

function mapPaymentStatus(status: string | null | undefined): StorePaymentStatus {
  if (status === "pending" || status === "paid" || status === "failed" || status === "cancelled") {
    return status;
  }

  return "unpaid";
}

function mapOrderItemRow(row: OrderItemRow): StoreOrderItem {
  return {
    id: row.id,
    productId: row.product_id || "",
    title: row.title,
    quantity: Number(row.quantity || 0),
    unitPrice: Number(row.unit_price || 0),
    totalPrice: Number(row.total_price || 0),
    currency: row.currency || "XOF",
  };
}

export function mapOrderRow(row: OrderRow): StoreOrder {
  const storeRelation = Array.isArray(row.shopfy_stores) ? row.shopfy_stores[0] : row.shopfy_stores;

  return {
    id: row.id,
    storeSlug: storeRelation?.slug || "",
    status: mapOrderStatus(row.status),
    source: row.status === "confirmed" && row.payment_status === "paid" ? "manual" : "platform",
    paymentStatus: mapPaymentStatus(row.payment_status),
    totalAmount: Number(row.total_amount || 0),
    currency: row.currency || "XOF",
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    customerEmail: row.customer_email || undefined,
    sellerComment: row.seller_comment || undefined,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at || undefined,
    cancelledAt: row.cancelled_at || undefined,
    actionUserId: row.action_user_id || undefined,
    items: (row.shopfy_store_order_items || []).map(mapOrderItemRow),
  };
}
