import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRequestClient } from "@/lib/supabaseAdmin";
import { createMonerooOrderPayment, isMonerooConfigured } from "@/lib/moneroo";
import { mapOrderRow, ORDER_SELECT_FIELDS, type OrderRow } from "@/lib/orderRows";
import { doesStoreRequireCertification } from "@/lib/storeRows";
import { cleanText } from "@/lib/validation";

type StoreOrdersRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type OrderItemInput = {
  productSlug?: string;
  quantity?: number;
};

type CreateOrderRequest = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentProvider?: "moneroo" | "manual";
  items?: OrderItemInput[];
};

type StoreProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number | string | null;
  currency: string | null;
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
  const body = (await request.json()) as CreateOrderRequest;
  const requestedItems = (body.items || [])
    .map((item) => ({
      productSlug: cleanText(item.productSlug),
      quantity: Number.isFinite(item.quantity) ? Math.max(1, Math.trunc(Number(item.quantity))) : 1,
    }))
    .filter((item) => item.productSlug);

  if (!cleanSlug || requestedItems.length === 0) {
    return NextResponse.json({ message: "Store and cart items are required." }, { status: 400 });
  }

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
        customer_name: cleanText(body.customerName),
        customer_phone: cleanText(body.customerPhone),
        customer_email: cleanText(body.customerEmail).toLowerCase(),
        total_amount: totalAmount,
        currency: store.currency || validOrderItems[0]?.currency || "XOF",
        payment_status: body.paymentProvider === "moneroo" ? "pending" : "unpaid",
        payment_provider: body.paymentProvider === "moneroo" ? "moneroo" : "manual",
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

    let paymentUrl = "";

    if (body.paymentProvider === "moneroo") {
      if (!isMonerooConfigured()) {
        await supabase
          .from("shopfy_store_orders")
          .update({
            payment_status: "failed",
            payment_error: "Moneroo is not configured.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        return NextResponse.json({ message: "Le paiement en ligne n'est pas encore configure." }, { status: 500 });
      }

      try {
        const payment = await createMonerooOrderPayment({
          orderId,
          storeSlug: cleanSlug,
          storeName: cleanText(store.name, cleanSlug),
          amount: totalAmount,
          currency: store.currency || validOrderItems[0]?.currency || "XOF",
          customer: {
            name: cleanText(body.customerName, "Client Shopfy"),
            email: cleanText(body.customerEmail),
            phone: cleanText(body.customerPhone),
          },
        });

        paymentUrl = payment.paymentUrl;

        const { error: paymentUpdateError } = await supabase
          .from("shopfy_store_orders")
          .update({
            payment_status: "pending",
            payment_provider: "moneroo",
            payment_reference: payment.reference,
            provider_transaction_id: payment.transactionId,
            payment_url: payment.paymentUrl,
            payment_requested_at: new Date().toISOString(),
            payment_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (paymentUpdateError) {
          return NextResponse.json({ message: paymentUpdateError.message }, { status: 500 });
        }
      } catch (error) {
        await supabase
          .from("shopfy_store_orders")
          .update({
            payment_status: "failed",
            payment_error: error instanceof Error ? error.message : "Moneroo payment creation failed.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        return NextResponse.json({ message: "Impossible de creer le paiement Moneroo." }, { status: 500 });
      }
    }

    const { data: refreshedOrder } = await supabase
      .from("shopfy_store_orders")
      .select(ORDER_SELECT_FIELDS)
      .eq("id", orderId)
      .single();

    return NextResponse.json({ order: mapOrderRow(refreshedOrder as OrderRow), paymentUrl });
  } catch {
    return NextResponse.json({ message: "Missing Supabase service role configuration." }, { status: 500 });
  }
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
