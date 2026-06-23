import { NextRequest } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1),
});

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid cart" }, { status: 400 });
  }

  const supabase = await createClient();
  const variantIds = parsed.data.items.map((i) => i.variantId);

  // Authoritative re-fetch — never trust client-supplied prices.
  const { data: variants, error } = await supabase
    .from("variants")
    .select("id, title, price_cents, currency, product:products(title, status, images), inventory(quantity, track)")
    .in("id", variantIds);

  if (error) {
    return Response.json({ error: "Could not load cart" }, { status: 500 });
  }

  type Row = {
    id: string;
    title: string;
    price_cents: number;
    currency: string;
    product: { title: string; status: string; images: string[] } | null;
    inventory: { quantity: number; track: boolean } | null;
  };
  const rows = (variants ?? []) as unknown as Row[];

  const line_items = [];
  for (const item of parsed.data.items) {
    const v = rows.find((r) => r.id === item.variantId);
    if (!v || !v.product || v.product.status !== "active") {
      return Response.json(
        { error: "An item is no longer available." },
        { status: 409 },
      );
    }
    const tracked = v.inventory?.track !== false;
    const stock = v.inventory?.quantity ?? 0;
    if (tracked && stock < item.quantity) {
      return Response.json(
        { error: `${v.product.title} (${v.title}) is out of stock.` },
        { status: 409 },
      );
    }
    line_items.push({
      quantity: item.quantity,
      price_data: {
        currency: v.currency,
        unit_amount: v.price_cents,
        product_data: {
          name: `${v.product.title} — ${v.title}`,
          images: v.product.images?.slice(0, 1) ?? [],
        },
      },
    });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${siteUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/cart`,
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
    customer_creation: "always",
    metadata: {
      cart: JSON.stringify(
        parsed.data.items.map((i) => ({ v: i.variantId, q: i.quantity })),
      ),
    },
  });

  return Response.json({ url: session.url });
}
