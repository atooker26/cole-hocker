/**
 * Send the store's order history to TEGO as purchases (POST /api/v1/purchases).
 *
 *   npm run backfill:tego              # dry run: counts and totals, sends nothing
 *   npm run backfill:tego -- --apply   # send
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * TEGO_API_KEY (scope purchases:write).
 *
 * Idempotent: externalId is the order id, the same one the Stripe webhook
 * sends, so re-running (or overlapping a live sale) updates rows, never
 * duplicates. paid/fulfilled orders go as paid; refunded as refunded;
 * pending/cancelled are skipped. TEGO only fires its purchase.recorded event
 * (flows) for a new sale under 3 days old, so old history won't email anyone.
 */
export {};
import ws from "ws";
// supabase-js builds a realtime client eagerly; Node < 22 has no global WebSocket.
(globalThis as { WebSocket?: unknown }).WebSocket ??= ws;

import { createClient } from "@supabase/supabase-js";
import { reportPurchaseToTego, salePayload, type TegoPurchase } from "../src/lib/tego-purchases";

const APPLY = process.argv.includes("--apply");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (APPLY && !process.env.TEGO_API_KEY) {
  console.error("Missing TEGO_API_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Row = {
  id: string;
  status: string;
  total_cents: number;
  currency: string | null;
  created_at: string;
  email: string | null;
  items: { product_title: string | null; variant_title: string | null; quantity: number }[] | null;
};

const STATUS: Record<string, TegoPurchase["status"] | undefined> = {
  paid: "paid",
  fulfilled: "paid",
  refunded: "refunded",
};

async function loadOrders(): Promise<Row[]> {
  const out: Row[] = [];
  const page = 500;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, total_cents, currency, created_at, email, items:order_items(product_title, variant_title, quantity)")
      .order("created_at", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw new Error(`orders read failed: ${error.message}`);
    out.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < page) return out;
  }
}

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

async function main() {
  const orders = await loadOrders();
  const byStatus: Record<string, { n: number; cents: number }> = {};
  const toSend: TegoPurchase[] = [];
  for (const o of orders) {
    const s = (byStatus[o.status] ??= { n: 0, cents: 0 });
    s.n++;
    s.cents += o.total_cents;
    const status = STATUS[o.status];
    if (status) toSend.push(salePayload(o, o.items ?? [], status));
  }

  console.log(`orders read: ${orders.length}`);
  for (const [k, v] of Object.entries(byStatus)) console.log(`  ${k}: ${v.n} (${usd(v.cents)})`);
  const paid = toSend.filter((p) => p.status === "paid");
  const refunded = toSend.filter((p) => p.status === "refunded");
  const sum = (xs: TegoPurchase[]) => xs.reduce((a, p) => a + p.amountCents, 0);
  console.log(`to send: ${toSend.length} — paid ${paid.length} (${usd(sum(paid))}), refunded ${refunded.length} (${usd(sum(refunded))})`);
  if (toSend.length) console.log(`range: ${toSend[0].occurredAt} → ${toSend[toSend.length - 1].occurredAt}`);
  console.log(`  with email: ${toSend.filter((p) => p.email).length}`);

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to send.");
    return;
  }

  let created = 0, updated = 0;
  const failed: { id: string; reason: string }[] = [];
  const queue = [...toSend];
  async function worker() {
    for (let p = queue.shift(); p; p = queue.shift()) {
      const r = await reportPurchaseToTego(p);
      if (!r.ok) failed.push({ id: p.externalId, reason: r.reason });
      else if (r.created) created++;
      else updated++;
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`\nsent: created ${created}, updated ${updated}, failed ${failed.length}`);
  for (const f of failed.slice(0, 20)) console.log(`  ${f.id}: ${f.reason}`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
