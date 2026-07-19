import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRequestClient } from "@/lib/supabaseAdmin";
// Online payment providers removed. Orders are created as manual by default.
import { mapOrderRow, ORDER_SELECT_FIELDS, type OrderRow } from "@/lib/orderRows";
import { doesStoreRequireCertification } from "@/lib/storeRows";
import { cleanText, hasUnsafeObjectKeys, isValidEmail } from "@/lib/validation";

type StoreOrdersRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type OrderItemInput = {
  productId?: string;
  productSlug?: string;
  quantity?: number;
  unitPrice?: number;
  discountAmount?: number;
};

type CreateOrderRequest = {
  source?: "manual" | "platform";
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  comment?: string;
  saleDate?: string;
  items?: OrderItemInput[];
};

type StoreProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number | string | null;
  currency: string | null;
  inventory_quantity?: number | null;
};

type StoreForOrderRow = {
  id: string;
  slug: string;
  name: string;
  currency: string | null;
  created_at: string | null;
  is_certified: boolean | null;
  certification_expires_at: string | null;
  shopfy_store_products?: StoreProductRow[];
};

export async function POST(request: Request, context: StoreOrdersRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);
  const body = (await request.json().catch(() => ({}))) as CreateOrderRequest;

  if (hasUnsafeObjectKeys(body)) {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (body.source === "manual") {
    return createManualSale(request, cleanSlug, body);
  }

  // Payments are handled outside the platform for this version.
  const customerName = cleanText(body.customerName);
  const customerPhone = cleanText(body.customerPhone);
  const customerEmail = cleanText(body.customerEmail).toLowerCase();
  const requestedItems = (body.items || [])
    .map((item) => {
      const quantity = Number(item.quantity);

      return {
        productSlug: cleanText(item.productSlug),
        quantity: Number.isFinite(quantity) ? Math.max(1, Math.min(999, Math.trunc(quantity))) : 1,
      };
    })
    .filter((item) => item.productSlug);

  if (!cleanSlug || requestedItems.length === 0) {
    return NextResponse.json({ message: "Store and cart items are required." }, { status: 400 });
  }

  if (customerEmail && !isValidEmail(customerEmail)) {
    return NextResponse.json({ message: "Customer email is invalid." }, { status: 400 });
  }

  // No online payment validation: all orders are treated as manual contact requests.

  try {
    const supabase = createSupabaseAdminClient();
    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, slug, name, currency, created_at, is_certified, certification_expires_at, shopfy_store_products (id, slug, title, price, currency)")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    const store = storeData as StoreForOrderRow;

    if (doesStoreRequireCertification(store)) {
      return NextResponse.json(
        { message: "Cette boutique doit etre activee/certifiee pour recevoir de nouvelles commandes." },
        { status: 403 },
      );
    }

    const productsBySlug = new Map((store.shopfy_store_products || []).map((product) => [product.slug, product]));
    const orderItems = requestedItems.map((item) => {
      const product = productsBySlug.get(item.productSlug);

      if (!product) {
        return null;
      }

      const unitPrice = Number(product.price || 0);
      const currency = product.currency || store.currency || "XOF";

      return {
        product,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        currency,
      };
    });

    if (orderItems.some((item) => !item)) {
      return NextResponse.json({ message: "One or more products are no longer available." }, { status: 400 });
    }

    const validOrderItems = orderItems.filter((item): item is NonNullable<typeof item> => Boolean(item));
    const totalAmount = validOrderItems.reduce((total, item) => total + item.totalPrice, 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ message: "Order total must be greater than zero." }, { status: 400 });
    }

    const { data: orderData, error: orderError } = await supabase
      .from("shopfy_store_orders")
      .insert({
        store_id: store.id,
        status: "pending",
        stock_reserved: false,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        total_amount: totalAmount,
        currency: store.currency || validOrderItems[0]?.currency || "XOF",
        payment_status: "unpaid",
      })
      .select("id")
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ message: orderError?.message || "Order creation failed." }, { status: 500 });
    }

    const orderId = String(orderData.id);
    const { error: itemsError } = await supabase
      .from("shopfy_store_order_items")
      .insert(validOrderItems.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        title: item.product.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        currency: item.currency,
      })));

    if (itemsError) {
      await supabase.from("shopfy_store_orders").delete().eq("id", orderId);
      return NextResponse.json({ message: itemsError.message }, { status: 500 });
    }

    // No external payment provider used. Orders are created and left in manual state.
    const { data: refreshedOrder } = await supabase
      .from("shopfy_store_orders")
      .select(ORDER_SELECT_FIELDS)
      .eq("id", orderId)
      .single();

    return NextResponse.json({ order: mapOrderRow(refreshedOrder as OrderRow), amount: totalAmount });
  } catch (error) {
    console.error("[orders] Store order creation failed.", {
      slug: cleanSlug,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ message: "Missing Supabase service role configuration." }, { status: 500 });
  }
}

async function createManualSale(request: Request, cleanSlug: string, body: CreateOrderRequest) {
  const customerName = cleanText(body.customerName);
  const customerPhone = cleanText(body.customerPhone);
  const sellerComment = cleanText(body.comment);
  const itemInput = body.items?.[0];
  const productId = cleanText(itemInput?.productId);
  const quantityValue = Number(itemInput?.quantity);
  const unitPriceValue = Number(itemInput?.unitPrice);
  const discountValue = Number(itemInput?.discountAmount || 0);
  const quantity = Number.isFinite(quantityValue) ? Math.max(1, Math.min(999, Math.trunc(quantityValue))) : 1;
  const unitPrice = Number.isFinite(unitPriceValue) ? unitPriceValue : 0;
  const discountAmount = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0;
  const totalAmount = Math.max(0, unitPrice * quantity - discountAmount);
  const saleDate = getSafeSaleDate(body.saleDate);

  if (!cleanSlug || !productId) {
    return NextResponse.json({ message: "Store and product are required." }, { status: 400 });
  }

  if (unitPrice <= 0 || totalAmount <= 0) {
    return NextResponse.json({ message: "Sale total must be greater than zero." }, { status: 400 });
  }

  try {
    const requestSupabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await requestSupabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data: storeData, error: storeError } = await adminSupabase
      .from("shopfy_stores")
      .select("id, owner_user_id, currency, created_at, is_certified, certification_expires_at")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez modifier que vos propres commandes." }, { status: 403 });
    }

    if (doesStoreRequireCertification(storeData)) {
      return NextResponse.json(
        { message: "Essai gratuit termine. Activez/certifiez la boutique pour enregistrer une vente." },
        { status: 403 },
      );
    }

    const { data: productData, error: productError } = await adminSupabase
      .from("shopfy_store_products")
      .select("id, title, currency, inventory_quantity")
      .eq("store_id", storeData.id)
      .eq("id", productId)
      .single();

    if (productError || !productData) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const currentInventory = Number(productData.inventory_quantity || 0);

    if (currentInventory < quantity) {
      return NextResponse.json({ message: "Stock insuffisant pour enregistrer cette vente." }, { status: 400 });
    }

    const { error: stockError } = await adminSupabase
      .from("shopfy_store_products")
      .update({
        inventory_quantity: currentInventory - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeData.id)
      .eq("id", productData.id);

    if (stockError) {
      return NextResponse.json({ message: stockError.message }, { status: 500 });
    }

    const currency = productData.currency || storeData.currency || "XOF";
    const { data: orderData, error: orderError } = await adminSupabase
      .from("shopfy_store_orders")
      .insert({
        store_id: storeData.id,
        status: "confirmed",
        stock_reserved: false,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: "",
        seller_comment: sellerComment,
        total_amount: totalAmount,
        currency,
        payment_status: "paid",
        payment_provider: "manual",
        created_at: saleDate,
        confirmed_at: saleDate,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !orderData) {
      await restoreProductStock(adminSupabase, storeData.id, productData.id, quantity);
      return NextResponse.json({ message: orderError?.message || "Manual sale creation failed." }, { status: 500 });
    }

    const orderId = String(orderData.id);
    const { error: itemsError } = await adminSupabase
      .from("shopfy_store_order_items")
      .insert({
        order_id: orderId,
        product_id: productData.id,
        title: productData.title,
        quantity,
        unit_price: unitPrice,
        total_price: totalAmount,
        currency,
      });

    if (itemsError) {
      await adminSupabase.from("shopfy_store_orders").delete().eq("id", orderId);
      await restoreProductStock(adminSupabase, storeData.id, productData.id, quantity);
      return NextResponse.json({ message: itemsError.message }, { status: 500 });
    }

    await refreshStoreSalesStats(adminSupabase, storeData.id);

    const { data: refreshedOrder } = await adminSupabase
      .from("shopfy_store_orders")
      .select(ORDER_SELECT_FIELDS)
      .eq("id", orderId)
      .single();

    return NextResponse.json({ order: mapOrderRow(refreshedOrder as OrderRow), amount: totalAmount });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Manual sale creation failed." },
      { status: 500 },
    );
  }
}

function getSafeSaleDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

async function restoreProductStock(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  storeId: string,
  productId: string,
  quantity: number,
) {
  const { data } = await supabase
    .from("shopfy_store_products")
    .select("inventory_quantity")
    .eq("store_id", storeId)
    .eq("id", productId)
    .single();

  await supabase
    .from("shopfy_store_products")
    .update({
      inventory_quantity: Number(data?.inventory_quantity || 0) + quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", storeId)
    .eq("id", productId);
}

async function refreshStoreSalesStats(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
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

export async function GET(request: Request, context: StoreOrdersRouteContext) {
  const { slug } = await context.params;
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return NextResponse.json({ orders: [], message: "Store is required." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ orders: [], message: "Authentication required." }, { status: 401 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("shopfy_stores")
      .select("id, owner_user_id")
      .eq("slug", cleanSlug)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ orders: [], message: "Store not found." }, { status: 404 });
    }

    if (storeData.owner_user_id !== authData.user.id) {
      return NextResponse.json({ orders: [], message: "Vous ne pouvez voir que vos propres commandes." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("shopfy_store_orders")
      .select(ORDER_SELECT_FIELDS)
      .eq("store_id", storeData.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ orders: [], message: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: ((data || []) as OrderRow[]).map(mapOrderRow) });
  } catch {
    return NextResponse.json({ orders: [], message: "Missing Supabase server configuration." }, { status: 500 });
  }
}
