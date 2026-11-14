// Run: npm test  (node:test under tsx; no extra test dependency)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  refundPayload,
  reportPurchaseToTego,
  salePayload,
  summarizeItems,
  TEGO_PURCHASES_URL,
} from "./tego-purchases";

const order = {
  id: "0b6f2a4e-1111-4222-8333-444455556666",
  total_cents: 4500,
  currency: "usd",
  created_at: "2026-11-01T15:00:00+00:00",
  email: "  Fan@Example.com ",
};

test("salePayload keys on the order id and normalizes fields", () => {
  const p = salePayload(order, [
    { product_title: "Signed Poster", variant_title: "Large", quantity: 2 },
    { product_title: "Hat", variant_title: "Default Title", quantity: 1 },
  ]);
  assert.deepEqual(p, {
    externalId: order.id,
    amountCents: 4500,
    occurredAt: "2026-11-01T15:00:00.000Z",
    currency: "USD",
    status: "paid",
    source: "api",
    summary: "2 × Signed Poster (Large), 1 × Hat",
    email: "fan@example.com",
  });
});

test("salePayload drops an email TEGO would reject and an empty summary", () => {
  const p = salePayload({ ...order, email: "" }, []);
  assert.equal(p.email, null);
  assert.equal(p.summary, null);
  assert.equal(salePayload(order, [], "refunded").status, "refunded");
});

test("summarizeItems caps at 500 chars", () => {
  const s = summarizeItems(Array.from({ length: 100 }, () => ({ product_title: "Long product name here", variant_title: "XL", quantity: 1 })));
  assert.ok(s && s.length === 500 && s.endsWith("…"));
});

test("refundPayload: partial refund stays paid at the net amount", () => {
  const p = refundPayload(order, 4500, 1500);
  assert.equal(p.externalId, order.id);
  assert.equal(p.status, "paid");
  assert.equal(p.amountCents, 3000);
  assert.equal(p.occurredAt, "2026-11-01T15:00:00.000Z");
  assert.equal("email" in p, false);
  assert.equal("summary" in p, false);
});

test("refundPayload: full refund is refunded at the original amount", () => {
  const p = refundPayload(order, 4500, 4500);
  assert.equal(p.status, "refunded");
  assert.equal(p.amountCents, 4500);
});

test("reportPurchaseToTego posts with the bearer key and reads 201 as created", async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ data: {} }), { status: 201 });
  }) as unknown as typeof fetch;
  const r = await reportPurchaseToTego(salePayload(order, []), { apiKey: "k", fetchImpl });
  assert.deepEqual(r, { ok: true, created: true });
  assert.equal(seen!.url, TEGO_PURCHASES_URL);
  assert.equal((seen!.init.headers as Record<string, string>).Authorization, "Bearer k");
  assert.equal(JSON.parse(seen!.init.body as string).externalId, order.id);
});

test("reportPurchaseToTego never throws: refusal, network error, no key", async () => {
  const errLog = console.error;
  console.error = () => {};
  try {
    const refused = (async () => new Response(JSON.stringify({ error: { code: "FORBIDDEN" } }), { status: 403 })) as unknown as typeof fetch;
    const r1 = await reportPurchaseToTego(salePayload(order, []), { apiKey: "k", fetchImpl: refused });
    assert.equal(r1.ok, false);
    const boom = (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
    const r2 = await reportPurchaseToTego(salePayload(order, []), { apiKey: "k", fetchImpl: boom });
    assert.deepEqual(r2, { ok: false, reason: "TypeError" });
    const saved = process.env.TEGO_API_KEY;
    delete process.env.TEGO_API_KEY;
    const r3 = await reportPurchaseToTego(salePayload(order, []), { fetchImpl: boom });
    if (saved !== undefined) process.env.TEGO_API_KEY = saved;
    assert.deepEqual(r3, { ok: false, reason: "no TEGO_API_KEY" });
  } finally {
    console.error = errLog;
  }
});
