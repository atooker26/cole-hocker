/**
 * Report store sales (and refunds) to TEGO, so Cole's TEGO account has real
 * purchases: email revenue attribution, the "Is it working?" sales tiles and
 * the app's Money screen all read them.
 *
 *   POST https://www.tegomarketing.com/api/v1/purchases  (scope purchases:write)
 *
 * TEGO is idempotent on (source, externalId), so the externalId is always the
 * order's id (orders.id, a UUID). That id exists for every order, including the
 * Shopify history that has no Stripe session, and the refund handler finds the
 * order by payment intent and re-sends the same id. A re-send updates the row.
 *
 * Best effort: reportPurchaseToTego never throws. A TEGO outage must never fail
 * the Stripe webhook or block an order; the backfill script
 * (scripts/backfill-tego-purchases.ts) can re-send anything that was missed.
 *
 * No "server-only" import on purpose: the backfill script runs this under tsx.
 */

export const TEGO_PURCHASES_URL = "https://www.tegomarketing.com/api/v1/purchases";

export type TegoPurchase = {
  externalId: string;
  amountCents: number;
  occurredAt: string;
  currency: string;
  status: "paid" | "refunded";
  source: "api";
  summary?: string | null;
  email?: string | null;
};

export type PurchaseOrder = {
  id: string;
  total_cents: number;
  currency: string | null;
  created_at: string;
  email: string | null;
};

export type PurchaseItem = {
  product_title: string | null;
  variant_title: string | null;
  quantity: number;
};

const SUMMARY_MAX = 500;

/** Pure. "2 × Signed Poster (Large), 1 × Hat", capped at TEGO's 500 chars. */
export function summarizeItems(items: PurchaseItem[]): string | null {
  const parts = items
    .map((i) => {
      const title = (i.product_title ?? "").trim();
      const variant = (i.variant_title ?? "").trim();
      const name = title && variant && variant !== "Default Title" ? `${title} (${variant})` : title || variant;
      return name ? `${i.quantity} × ${name}` : null;
    })
    .filter((x): x is string => x !== null);
  if (!parts.length) return null;
  const s = parts.join(", ");
  return s.length > SUMMARY_MAX ? `${s.slice(0, SUMMARY_MAX - 1)}…` : s;
}

function cleanEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/**
 * Pure. A sale. `refunded` marks a fully refunded order (TEGO keeps the
 * original amount and drops the email credit), anything else is paid.
 */
export function salePayload(
  order: PurchaseOrder,
  items: PurchaseItem[],
  status: "paid" | "refunded" = "paid",
): TegoPurchase {
  return {
    externalId: order.id,
    amountCents: Math.max(0, Math.round(order.total_cents)),
    occurredAt: new Date(order.created_at).toISOString(),
    currency: (order.currency || "usd").toUpperCase(),
    status,
    source: "api",
    summary: summarizeItems(items),
    email: cleanEmail(order.email),
  };
}

/**
 * Pure. A refund on an order already reported, following TEGO's rule: a
 * partial refund keeps the purchase paid at the net amount; a full refund marks
 * it refunded at the original amount (never deleted). `refundedCents` is the
 * charge's cumulative amount_refunded. Summary and email are left out, so TEGO
 * keeps what the sale sent. occurredAt stays the sale's time (TEGO overwrites it).
 */
export function refundPayload(
  order: Pick<PurchaseOrder, "id" | "currency" | "created_at">,
  paidCents: number,
  refundedCents: number,
): TegoPurchase {
  const net = paidCents - refundedCents;
  const full = net <= 0;
  return {
    externalId: order.id,
    amountCents: full ? Math.max(0, paidCents) : net,
    occurredAt: new Date(order.created_at).toISOString(),
    currency: (order.currency || "usd").toUpperCase(),
    status: full ? "refunded" : "paid",
    source: "api",
  };
}

export type ReportResult = { ok: true; created: boolean } | { ok: false; reason: string };

/** POST one purchase to TEGO. Never throws; logs and returns why on failure. */
export async function reportPurchaseToTego(
  purchase: TegoPurchase,
  opts: { apiKey?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<ReportResult> {
  const apiKey = opts.apiKey ?? process.env.TEGO_API_KEY;
  if (!apiKey) return { ok: false, reason: "no TEGO_API_KEY" };
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(TEGO_PURCHASES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(purchase),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
      const reason = `${res.status} ${detail.error?.code ?? ""} ${detail.error?.message ?? ""}`.trim();
      console.error("[tego-purchases] TEGO refused purchase", { externalId: purchase.externalId, reason });
      return { ok: false, reason };
    }
    return { ok: true, created: res.status === 201 };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "unknown";
    console.error("[tego-purchases] TEGO unreachable", { externalId: purchase.externalId, reason });
    return { ok: false, reason };
  }
}
