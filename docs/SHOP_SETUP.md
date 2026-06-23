# Shop setup (Cole Hocker)

Self-hosted storefront + admin that replaces Shopify. Stack: Next.js 16 App
Router, Supabase (Postgres + Auth + Storage), Stripe Checkout (hosted) + Stripe
Connect for a configurable revenue split.

> Goal: ship Cole's shop first, then generalize this repo into a
> clone-and-retheme template for other Nike athletes. Keep athlete-specific
> branding/config centralized so a future fork is a re-theme, not a rewrite.

## Environment variables

Put these in a project-root `.env.local` (NOT in `src/` — Next loads env from the
root) and mirror them into Vercel (Production + Preview).

| Var | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (RLS-limited) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Webhook + migration; bypasses RLS |
| `STRIPE_SECRET_KEY` | server only | Stripe API (use `sk_test_…` first) |
| `STRIPE_WEBHOOK_SECRET` | server only | Verifies Stripe webhook signatures |
| `NEXT_PUBLIC_SITE_URL` | public | Base URL for Checkout success/cancel |
| `KIRK_NOTIFY_EMAIL` | server only | Where fulfillment notifications go |
| `STRIPE_KIRK_ACCOUNT_ID` | server only | (optional) Kirk's Connect account |
| `STRIPE_COLE_ACCOUNT_ID` | server only | (optional) Cole's Connect account |
| `WEBHOOK_SECRET` | server only | Auth for the TEGO webhook (email pipeline) |

All shop emails (order to Kirk, customer confirmation, shipped) post to the TEGO
webhook and are sent via TEGO's AWS/SES pipeline — no separate email provider.

Connect IDs + the Kirk % are read from the `settings` table at runtime, so the
env vars above are only a fallback / bootstrap. Real transfers turn on by setting
`connect_enabled = true` and the account IDs in `/admin/settings` — no redeploy.

## Provisioning (one-time)

1. **Supabase project** — create it, then apply the schema:
   `supabase/migrations/0001_init_shop.sql` (via Supabase CLI `supabase db push`,
   the SQL editor, or the MCP `apply_migration`). It creates all tables, RLS, the
   `decrement_inventory` RPC, and seeds the single `settings` row.
2. **Storage bucket** — create a public bucket `product-images`.
3. **Admin users** — in Supabase Auth, create accounts for Cole + TEGO staff.
   Disable public signups (Auth → Providers → Email → "Allow new users" off).
4. **Generated types** (optional but recommended):
   `supabase gen types typescript --linked > src/lib/database.types.ts`
   and migrate `src/lib/shop-types.ts` usages over time.
5. **Stripe** — enable hosted Checkout. Add a webhook endpoint pointing at
   `/api/webhooks/stripe` for the `checkout.session.completed` event; copy its
   signing secret into `STRIPE_WEBHOOK_SECRET`.
6. **Vercel** — add all env vars to Production + Preview.

## Local development / webhook testing

```bash
npm run dev
# in another terminal:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the printed whsec_… into STRIPE_WEBHOOK_SECRET
# test card: 4242 4242 4242 4242, any future expiry / CVC / ZIP
```

## ShipStation (fulfillment)

Inert until configured. When `SHIPSTATION_API_KEY` + `SHIPSTATION_API_SECRET`
are set, each paid order is pushed to ShipStation (`orders.shipstation_order_id`
is stored). When Kirk ships, ShipStation calls our `SHIP_NOTIFY` webhook and we
write the tracking number back to the order, mark it fulfilled, and email the
customer.

Setup:
1. ShipStation → Account → API Settings → generate an **API Key + Secret**.
2. Set `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET`, and a random
   `SHIPSTATION_WEBHOOK_TOKEN` (any long secret string) in env + Vercel.
3. Register the inbound webhook (production URL must be public):
   `npm run shipstation:subscribe`
   This subscribes `SHIP_NOTIFY` → `/api/webhooks/shipstation?token=…`.

## Shopify migration

Export Products CSV + Orders/Customers CSV from Shopify, then:

```bash
npm run migrate:shopify   # scripts/migrate-shopify.ts (uses the service-role key)
```

Re-runs are idempotent (upserts key on the `shopify_*` columns).
