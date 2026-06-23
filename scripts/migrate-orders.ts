/**
 * Import Shopify order + customer history into Supabase.
 *
 *   ORDERS_CSV=/path/to/orders_export.csv npm run migrate:orders
 *   (defaults to scripts/data/orders_export.csv)
 *
 * Idempotent: orders upsert on shopify_order_id (Shopify "Name", e.g. #1001);
 * line items are replaced per order; customers upsert on email. Historical
 * orders get a fresh internal order_number; the Shopify name is kept in
 * shopify_order_id. Split columns stay 0 (no Connect on historical orders).
 */
export {};
import ws from "ws";
// supabase-js builds a realtime client eagerly; Node < 22 has no global WebSocket.
(globalThis as { WebSocket?: unknown }).WebSocket ??= ws;

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const CSV_PATH =
  process.env.ORDERS_CSV || resolve(process.cwd(), "scripts/data/orders_export.csv");

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function cents(v: string): number {
  const n = parseFloat(v || "0");
  return Math.round((isNaN(n) ? 0 : n) * 100);
}

function mapStatus(financial: string, fulfillment: string, cancelledAt: string) {
  if (cancelledAt) return "cancelled";
  const f = (financial || "").toLowerCase();
  if (f.includes("refunded")) return "refunded";
  if (f === "voided") return "cancelled";
  if ((fulfillment || "").toLowerCase() === "fulfilled") return "fulfilled";
  if (f === "paid") return "paid";
  return "pending";
}

async function main() {
  const records = parseCsv(readFileSync(CSV_PATH, "utf8"));

  // Group rows by order Name (Shopify repeats order-level fields only on row 1).
  const byOrder = new Map<string, Record<string, string>[]>();
  for (const r of records) {
    const name = r["Name"];
    if (!name) continue;
    if (!byOrder.has(name)) byOrder.set(name, []);
    byOrder.get(name)!.push(r);
  }

  let orders = 0;
  let items = 0;
  const seenCustomers = new Set<string>();

  for (const [name, rows] of byOrder) {
    const head = rows.find((r) => r["Email"] || r["Total"]) ?? rows[0];
    const email = (head["Email"] || "").toLowerCase().trim();

    let customerId: string | null = null;
    if (email) {
      const { data: cust } = await supabase
        .from("customers")
        .upsert(
          { email, name: head["Shipping Name"] || head["Billing Name"] || null },
          { onConflict: "email" },
        )
        .select("id")
        .single();
      customerId = cust?.id ?? null;
      seenCustomers.add(email);
    }

    const shippingAddress = head["Shipping Address1"]
      ? {
          name: head["Shipping Name"] || null,
          line1: head["Shipping Address1"] || null,
          line2: head["Shipping Address2"] || null,
          city: head["Shipping City"] || null,
          state: head["Shipping Province"] || null,
          postal_code: head["Shipping Zip"] || null,
          country: head["Shipping Country"] || null,
        }
      : null;

    const createdAt = head["Created at"]
      ? new Date(head["Created at"]).toISOString()
      : undefined;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .upsert(
        {
          shopify_order_id: name,
          email,
          customer_id: customerId,
          status: mapStatus(
            head["Financial Status"],
            head["Fulfillment Status"],
            head["Cancelled at"],
          ),
          fulfillment_status:
            (head["Fulfillment Status"] || "").toLowerCase() === "fulfilled"
              ? "fulfilled"
              : "unfulfilled",
          subtotal_cents: cents(head["Subtotal"]),
          shipping_cents: cents(head["Shipping"]),
          total_cents: cents(head["Total"]),
          currency: (head["Currency"] || "usd").toLowerCase(),
          shipping_address: shippingAddress,
          ...(createdAt ? { created_at: createdAt } : {}),
        },
        { onConflict: "shopify_order_id" },
      )
      .select("id")
      .single();
    if (oErr) {
      console.error(`Order ${name} failed:`, oErr.message);
      continue;
    }
    orders++;

    // Replace line items so re-runs don't duplicate.
    await supabase.from("order_items").delete().eq("order_id", order.id);
    const itemRows = rows
      .filter((r) => r["Lineitem name"])
      .map((r) => {
        const qty = parseInt(r["Lineitem quantity"] || "1", 10) || 1;
        const unit = cents(r["Lineitem price"]);
        return {
          order_id: order.id,
          variant_id: null,
          product_title: r["Lineitem name"] || "",
          variant_title: r["Lineitem sku"] || "",
          unit_price_cents: unit,
          quantity: qty,
          subtotal_cents: unit * qty,
        };
      });
    if (itemRows.length) {
      await supabase.from("order_items").insert(itemRows);
      items += itemRows.length;
    }
  }

  console.log(
    `✓ Imported ${orders} orders, ${items} line items, ${seenCustomers.size} customers.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
