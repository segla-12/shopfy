import type { CreateStoreInput } from "@/lib/createdStores";
import { ADMIN_SECRET_HEADER } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";
import type { ShopfyStore, StoreOrder, StoreOrderStatus, StoreProduct } from "@/types/storefront";

type StoreListResponse = {
  stores?: ShopfyStore[];
  message?: string;
};

type StoreResponse = {
  store?: ShopfyStore;
  message?: string;
};

type ProductResponse = {
  product?: StoreProduct;
  message?: string;
};

type OrderResponse = {
  order?: StoreOrder;
  amount?: number;
  message?: string;
};

type CertificationPaymentResponse = {
  message?: string;
};

type OrderListResponse = {
  orders?: StoreOrder[];
  message?: string;
};

type PendingOrderItemInput = {
  productSlug: string;
  quantity: number;
};

export type ManualStoreSaleInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  customerName?: string;
  customerPhone?: string;
  comment?: string;
  saleDate?: string;
};

type StoreOrderCustomerInput = {
  name: string;
  phone: string;
  email: string;
};

export type StoreUpdateInput = {
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  ownerName: string;
  city: string;
  country: string;
  currency: string;
  whatsappPhone: string;
  primaryColor: string;
  accentColor: string;
};

const authRequiredMessage = "Connectez-vous avec votre compte vendeur pour continuer.";

async function getAuthenticatedHeaders(includeJson = true): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error(authRequiredMessage);
  }

  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${accessToken}`,
  };
}

function getAdminHeaders(adminSecret: string, includeJson = true): HeadersInit {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    [ADMIN_SECRET_HEADER]: adminSecret,
  };
}

export async function getSupabaseStores(): Promise<ShopfyStore[]> {
  const response = await fetch("/api/stores", { cache: "no-store" });

  if (!response.ok) {
    return [];
  }

  const result = (await response.json()) as StoreListResponse;
  return result.stores || [];
}

export async function getMySupabaseStores(): Promise<ShopfyStore[]> {
  const headers = await getAuthenticatedHeaders(false);
  const response = await fetch("/api/stores?mine=true", { headers, cache: "no-store" });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as StoreListResponse;
    throw new Error(result.message || "Unable to load your stores.");
  }

  const result = (await response.json()) as StoreListResponse;
  return result.stores || [];
}

export async function getAdminSupabaseStore(storeSlug: string, adminSecret: string): Promise<ShopfyStore> {
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}?admin=true`, {
    headers: getAdminHeaders(adminSecret, false),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => ({}))) as StoreResponse;

  if (!response.ok || !result.store) {
    throw new Error(result.message || "Unable to load this store.");
  }

  return result.store;
}

export async function getSupabaseStore(slug: string): Promise<ShopfyStore | null> {
  const response = await fetch(`/api/stores/${encodeURIComponent(slug)}`, { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as StoreResponse;
  return result.store || null;
}

export async function createSupabaseStore(input: CreateStoreInput): Promise<ShopfyStore> {
  const headers = await getAuthenticatedHeaders();
  const response = await fetch("/api/stores", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

  const result = (await response.json()) as StoreResponse;

  if (!response.ok || !result.store) {
    throw new Error(result.message || "Store creation failed.");
  }

  return result.store;
}

export async function updateSupabaseStore(storeSlug: string, store: StoreUpdateInput, adminSecret = ""): Promise<ShopfyStore> {
  const headers = adminSecret ? getAdminHeaders(adminSecret) : await getAuthenticatedHeaders();
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ store }),
  });

  const result = (await response.json()) as StoreResponse;

  if (!response.ok || !result.store) {
    throw new Error(result.message || "Store update failed.");
  }

  return result.store;
}

export async function importSupabaseStoreProduct(storeSlug: string, product: StoreProduct): Promise<StoreProduct> {
  const headers = await getAuthenticatedHeaders();
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/products`, {
    method: "POST",
    headers,
    body: JSON.stringify({ product }),
  });

  const result = (await response.json()) as ProductResponse;

  if (!response.ok || !result.product) {
    throw new Error(result.message || "Product import failed.");
  }

  return result.product;
}

export async function addManualSupabaseStoreProduct(storeSlug: string, product: StoreProduct, adminSecret = ""): Promise<StoreProduct> {
  const headers = adminSecret ? getAdminHeaders(adminSecret) : await getAuthenticatedHeaders();
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/products`, {
    method: "POST",
    headers,
    body: JSON.stringify({ product }),
  });

  const result = (await response.json()) as ProductResponse;

  if (!response.ok || !result.product) {
    throw new Error(result.message || "Product creation failed.");
  }

  return result.product;
}

export async function deleteSupabaseStoreProduct(storeSlug: string, productId: string) {
  const headers = await getAuthenticatedHeaders(false);
  const response = await fetch(
    `/api/stores/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productId)}`,
    { method: "DELETE", headers },
  );

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "Product removal failed.");
  }
}

export async function deleteSupabaseStore(storeSlug: string, adminSecret: string) {
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}`, {
    method: "DELETE",
    headers: getAdminHeaders(adminSecret, false),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "Store deletion failed.");
  }
}

export async function deleteAdminSupabaseStoreProduct(storeSlug: string, productId: string, adminSecret: string) {
  const response = await fetch(
    `/api/stores/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productId)}`,
    { method: "DELETE", headers: getAdminHeaders(adminSecret, false) },
  );

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "Product removal failed.");
  }
}

export async function updateSupabaseStoreProduct(
  storeSlug: string,
  productId: string,
  product: Partial<StoreProduct>,
  adminSecret = "",
): Promise<StoreProduct> {
  const headers = adminSecret ? getAdminHeaders(adminSecret) : await getAuthenticatedHeaders();
  const response = await fetch(
    `/api/stores/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ product }),
    },
  );

  const result = (await response.json()) as ProductResponse;

  if (!response.ok || !result.product) {
    throw new Error(result.message || "Product update failed.");
  }

  return result.product;
}

export async function createPendingStoreOrder(
  storeSlug: string,
  items: PendingOrderItemInput[],
  customer?: Partial<StoreOrderCustomerInput>,
): Promise<StoreOrder> {
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      customerEmail: customer?.email,
    }),
  });

  const result = (await response.json()) as OrderResponse;

  if (!response.ok || !result.order) {
    throw new Error(result.message || "Order creation failed.");
  }

  return result.order;
}

export async function createManualSupabaseStoreSale(
  storeSlug: string,
  sale: ManualStoreSaleInput,
  adminSecret = "",
): Promise<StoreOrder> {
  const headers = adminSecret ? getAdminHeaders(adminSecret) : await getAuthenticatedHeaders();
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "manual",
      items: [{
        productId: sale.productId,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        discountAmount: sale.discountAmount,
      }],
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      comment: sale.comment,
      saleDate: sale.saleDate,
    }),
  });

  const result = (await response.json()) as OrderResponse;

  if (!response.ok || !result.order) {
    throw new Error(result.message || "Manual sale creation failed.");
  }

  return result.order;
}

export async function createStoreCertificationPayment(
  storeSlug: string,
  durationMonths: number,
): Promise<{ message?: string }>
{
  const headers = await getAuthenticatedHeaders();
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/certification`, {
    method: "POST",
    headers,
    body: JSON.stringify({ durationMonths }),
  });

  const result = (await response.json()) as CertificationPaymentResponse;

  if (!response.ok) {
    throw new Error(result.message || "Certification request failed.");
  }

  return { message: result.message };
}

export async function getMySupabaseStoreOrders(storeSlug: string): Promise<StoreOrder[]> {
  const headers = await getAuthenticatedHeaders(false);
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/orders`, { headers, cache: "no-store" });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as OrderListResponse;
    throw new Error(result.message || "Unable to load your orders.");
  }

  const result = (await response.json()) as OrderListResponse;
  return result.orders || [];
}

export async function getAdminSupabaseStoreOrders(storeSlug: string, adminSecret: string): Promise<StoreOrder[]> {
  const response = await fetch(`/api/stores/${encodeURIComponent(storeSlug)}/orders`, {
    headers: getAdminHeaders(adminSecret, false),
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as OrderListResponse;
    throw new Error(result.message || "Unable to load orders.");
  }

  const result = (await response.json()) as OrderListResponse;
  return result.orders || [];
}

export async function updateSupabaseStoreOrderStatus(
  storeSlug: string,
  orderId: string,
  status: StoreOrderStatus,
  adminSecret = "",
): Promise<StoreOrder> {
  const headers = adminSecret ? getAdminHeaders(adminSecret) : await getAuthenticatedHeaders();
  const response = await fetch(
    `/api/stores/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    },
  );

  const result = (await response.json()) as OrderResponse;

  if (!response.ok || !result.order) {
    throw new Error(result.message || "Order update failed.");
  }

  return result.order;
}

export async function deleteSupabaseStoreOrder(storeSlug: string, orderId: string, adminSecret = "") {
  const headers = adminSecret ? getAdminHeaders(adminSecret, false) : await getAuthenticatedHeaders(false);
  const response = await fetch(
    `/api/stores/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(orderId)}`,
    { method: "DELETE", headers },
  );

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message || "Order deletion failed.");
  }
}
