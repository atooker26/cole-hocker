import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeSplit } from "@/lib/split";
import { notifyKirk, notifyCustomer } from "@/lib/notify";
import {
  shipstationConfigured,
  createShipstationOrder,
} from "@/lib/shipstation";
import type { Json } from "@/lib/database.types";

export const runtime = "nodejs";

type ShippingDetails = {
  name?: string | null;
  address?: Record<string, unknown> | null;
};

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new Response("Missing signature", { status: 400 });
  }

  const stripe = getStripe();
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  const supabase = createAdminClient();

  if (event.type === "charge.refunded") {
    await handleRefund(supabase, event.data.object as Stripe.Charge);
    return new Response("ok", { status: 200 });
  }
  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Idempotency — Stripe retries; only fulfill once.
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (existing) return new Response("ok", { status: 200 });

  let cart: { v: string; q: number }[] = [];
  try {
    cart = JSON.parse(session.metadata?.cart ?? "[]");
  } catch {
    cart = [];
  }
  if (!cart.length) return new Response("ok", { status: 200 });

  const variantIds = cart.map((c) => c.v);
  const { data: variants } = await supabase
    .from("variants")
    .select("id, title, price_cents, currency, product:products(title)")
    .in("id", variantIds);

  type VRow = {
    id: string;
    title: string;
    price_cents: number;
    currency: string;
    product: { title: string } | null;
  };
  const rows = (variants ?? []) as unknown as VRow[];

  const orderId = randomUUID();
  let subtotal = 0;
  const items = cart
    .map((c) => {
      const v = rows.find((r) => r.id === c.v);
      if (!v) return null;
      const line = v.price_cents * c.q;
      subtotal += line;
      return {
        order_id: orderId,
        variant_id: v.id,
        product_title: v.product?.title ?? "",
        variant_title: v.title,
        unit_price_cents: v.price_cents,
        quantity: c.q,
        subtotal_cents: line,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const currency = rows[0]?.currency ?? "usd";
  const shippingCents = session.shipping_cost?.amount_total ?? 0;
  const totalCents = session.amount_total ?? subtotal + shippingCents;
  const email = session.customer_details?.email ?? "";

  // Shipping address (field moved between Stripe API versions — read defensively).
  const s = session as unknown as {
    collected_information?: { shipping_details?: ShippingDetails | null };
    shipping_details?: ShippingDetails | null;
  };
  const ship = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
  const shippingAddress: Record<string, unknown> | null = ship?.address
    ? { name: ship.name ?? null, ...ship.address }
    : session.customer_details?.address
      ? { name: session.customer_details.name ?? null, ...session.customer_details.address }
      : null;

  // Upsert customer.
  let customerId: string | null = null;
  if (email) {
    const { data: cust } = await supabase
      .from("customers")
      .upsert(
        {
          email,
          name: session.customer_details?.name ?? null,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();
    customerId = cust?.id ?? null;
  }

  // Configurable split.
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  const kirkPct = Number(settings?.kirk_pct ?? 0);
  const platformPct = Number(settings?.platform_pct ?? 0);
  // Split on the item revenue ACTUALLY collected. amount_subtotal is the
  // pre-discount item total, so subtract the discount; shipping/tax are excluded
  // (they aren't in amount_subtotal). Falls back to the recomputed subtotal.
  const discountCents = session.total_details?.amount_discount ?? 0;
  const splitBase = Math.max(
    0,
    (session.amount_subtotal ?? subtotal) - discountCents,
  );
  const split = computeSplit(splitBase, kirkPct, platformPct);

  // The INSERT is the authoritative idempotency guard: the unique constraint on
  // stripe_checkout_session_id means a concurrent/duplicate delivery that raced
  // past the existence check above will fail here. If it fails, bail BEFORE
  // decrementing inventory or creating transfers so we never double-fulfill.
  const { data: inserted, error: insertError } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      customer_id: customerId,
      email,
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      subtotal_cents: splitBase,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency,
      shipping_address: shippingAddress as Json,
      kirk_pct: kirkPct,
      kirk_amount_cents: split.kirkCents,
      cole_amount_cents: split.coleCents,
      platform_amount_cents: split.platformCents,
      connect_kirk_account_id: settings?.kirk_connect_account_id ?? null,
      connect_cole_account_id: settings?.cole_connect_account_id ?? null,
      connect_transfer_status: "none",
    })
    .select("order_number")
    .single();
  if (insertError) {
    console.error("order insert failed (likely duplicate delivery):", insertError.message);
    return new Response("ok", { status: 200 });
  }

  if (items.length) await supabase.from("order_items").insert(items);

  // Authoritative inventory decrement (oversell guard). Runs once per order
  // (the insert above is the dedupe point). decrement_inventory returns false
  // when a tracked variant is short — the customer already paid, so flag it
  // loudly rather than silently shipping nothing.
  for (const c of cart) {
    const { data: decremented } = await supabase.rpc("decrement_inventory", {
      p_variant_id: c.v,
      p_qty: c.q,
    });
    if (decremented === false) {
      console.error(
        `OVERSOLD: order ${orderId} variant ${c.v} qty ${c.q} — insufficient stock`,
      );
    }
  }

  // Optional Connect transfers (only when fully configured + enabled).
  if (
    settings?.connect_enabled &&
    settings.kirk_connect_account_id &&
    settings.cole_connect_account_id
  ) {
    try {
      // Tie transfers to the charge so they draw from those funds as the charge
      // settles (avoids "insufficient available balance" on a fresh platform).
      let sourceTransaction: string | undefined;
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined;
      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId);
        sourceTransaction =
          typeof pi.latest_charge === "string"
            ? pi.latest_charge
            : (pi.latest_charge?.id ?? undefined);
      }

      if (split.kirkCents > 0) {
        await stripe.transfers.create(
          {
            amount: split.kirkCents,
            currency,
            destination: settings.kirk_connect_account_id,
            transfer_group: orderId,
            ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
          },
          { idempotencyKey: `transfer-kirk:${orderId}` },
        );
      }
      if (split.coleCents > 0) {
        await stripe.transfers.create(
          {
            amount: split.coleCents,
            currency,
            destination: settings.cole_connect_account_id,
            transfer_group: orderId,
            ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
          },
          { idempotencyKey: `transfer-cole:${orderId}` },
        );
      }
      await supabase
        .from("orders")
        .update({ connect_transfer_status: "transferred" })
        .eq("id", orderId);
    } catch (err) {
      console.error("Connect transfer failed:", err);
      await supabase
        .from("orders")
        .update({ connect_transfer_status: "pending" })
        .eq("id", orderId);
    }
  }

  const notifyItems = items.map((i) => ({
    title: i.product_title,
    variant: i.variant_title,
    quantity: i.quantity,
  }));
  const orderNumber = inserted?.order_number ?? 0;

  // Push to ShipStation for fulfillment (best-effort; inert until configured).
  if (shipstationConfigured()) {
    const ssId = await createShipstationOrder({
      orderNumber: String(orderNumber),
      orderDate: new Date().toISOString(),
      email,
      amountPaidCents: totalCents,
      shippingAddress,
      items: items.map((i) => ({
        name: `${i.product_title} — ${i.variant_title}`,
        quantity: i.quantity,
        unitPriceCents: i.unit_price_cents,
      })),
    });
    if (ssId) {
      await supabase
        .from("orders")
        .update({ shipstation_order_id: ssId })
        .eq("id", orderId);
    }
  }

  await Promise.all([
    notifyKirk({
      dedupeKey: `new-order-kirk:${session.id}`,
      orderNumber,
      email,
      items: notifyItems,
      shippingAddress,
    }),
    notifyCustomer({
      dedupeKey: `order-confirmation:${session.id}`,
      orderNumber,
      email,
      items: notifyItems,
      totalCents,
    }),
  ]);

  revalidatePath("/admin/orders");
  return new Response("ok", { status: 200 });
}

/** Mark a fully-refunded order and restock its tracked variants. */
async function handleRefund(
  supabase: ReturnType<typeof createAdminClient>,
  charge: Stripe.Charge,
) {
  if (charge.amount_refunded < charge.amount) return; // ignore partial refunds
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, items:order_items(variant_id, quantity)")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();
  if (!order || order.status === "refunded") return;

  await supabase.from("orders").update({ status: "refunded" }).eq("id", order.id);

  // Restock: decrement by a negative qty = increment. Untracked variants are a
  // no-op inside the RPC, so made-to-order items are unaffected.
  const refundItems = (order.items ?? []) as {
    variant_id: string | null;
    quantity: number;
  }[];
  for (const it of refundItems) {
    if (it.variant_id) {
      await supabase.rpc("decrement_inventory", {
        p_variant_id: it.variant_id,
        p_qty: -it.quantity,
      });
    }
  }

  revalidatePath("/admin/orders");
}
