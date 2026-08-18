# Email setup (Cole Hocker)

Transactional email is sent through **TEGO's SES-backed relay** — the same system
Sorted Luxe runs on. This repo owns no Resend or SES domain. Instead it POSTs to
one TEGO endpoint, and TEGO sends from a white-labeled Cole Hocker identity over
AWS SES, records the send for analytics, and auto-suppresses bounces/complaints.

> Nothing about AWS lives in this repo. You hold one API key and call one URL.
> TEGO owns the domain verification, the SES credentials, and the deliverability.

## Why the relay (not Resend/SES directly)

- **No creds in this repo.** SES keys never leave TEGO. You hold a single scoped
  API key.
- **White-label From, server-enforced.** TEGO sets `From` to
  `"Cole Hocker" <hello@colehocker.com>` from the account's verified sending
  identity. Callers cannot spoof it — `from` is not a request field.
- **Deliverability handled.** DKIM/SPF/DMARC, the `tego-ses-events` config set,
  bounce/complaint suppression, and CRM capture all happen on TEGO's side.
- **Free + unmetered.** Transactional sends don't touch the email wallet or any
  warm-up bounce gate.

## How it works

```
this app  --POST /api/v1/email/send (Bearer key)-->  TEGO  --SES-->  recipient
              { to, subject, html, text?, replyTo? }
```

- Endpoint: `POST https://www.tegomarketing.com/api/v1/email/send`
- Auth: `Authorization: Bearer <TEGO_API_KEY>` — the key is scoped to `email:send`.
- Body: `{ to, subject, html, text?, replyTo? }`. **`from` is omitted** — TEGO
  derives it from the account. `html` is required.
- Response: `{ ok: true, messageId }` on success; `{ error: { code, message } }`
  with a 4xx/5xx otherwise.
- Side effects (best-effort, server-side): the recipient is upserted into TEGO's
  CRM, and the send is recorded against a per-account "Transactional"
  pseudo-campaign so SES open/click/bounce/complaint events attach. Permanent
  bounces + complaints auto-suppress that contact.

TEGO endpoint for reference: `app/api/v1/email/send/route.ts` (PRs #286/#287).

## Prerequisite — one-time TEGO-side setup

The code below does nothing until Cole Hocker exists as an account in TEGO. Ask
the TEGO admin (Aidan) to:

1. Create/confirm an **EmailAccount** for Cole Hocker with a **verified sending
   domain** (`colehocker.com`) and `sendingEmail` set (e.g.
   `hello@colehocker.com`). The From identity is `"<account name>" <sendingEmail>`.
2. Mint a **client-owned API key** scoped to `email:send` (admin → `/portal/admin/api-keys`).
   Because the key is client-owned, TEGO resolves it straight to the Cole Hocker
   account — you never pass an `accountId`.

Until the domain is verified in SES, sends fail with a `NO_SENDING_IDENTITY` or
`SEND_FAILED` error.

## Environment variables

Add to project-root `.env.local` and mirror into Vercel (Production + Preview):

| Var | Scope | Purpose |
| --- | --- | --- |
| `TEGO_API_KEY` | server only | Client-owned key scoped `email:send`. Bearer token to the relay. |

> A single client-owned key is all you need. (The shared platform `TEGO_API_KEY`
> would also work but requires passing `accountId` in the body — use a
> client-owned key and skip that.)

## Reference implementation (mirror Sorted Luxe's `src/lib/email/`)

Sorted Luxe wraps the relay in three small files. Copy the shape:

- `send.ts` — the raw relay client (below). Paste-ready.
- `log.ts` — `sendOnce()`, an **idempotent** wrapper that records a `dedupe_key`
  in a Supabase `email_log` table and no-ops on repeat. **Use this everywhere**,
  not raw `sendEmail` — Stripe/ShipStation webhooks can fire twice and you don't
  want double order confirmations.
- `templates.ts` — branded HTML builders (header, footer, button) so every send
  looks like Cole Hocker.

### `src/lib/email/send.ts` (paste-ready)

```ts
import "server-only";

/**
 * Transactional email via TEGO's SES-backed relay. TEGO fixes the From identity
 * to "Cole Hocker" <hello@colehocker.com> (domain DKIM-verified in SES), so
 * `from` is intentionally not a parameter. Env: TEGO_API_KEY (scoped email:send,
 * client-owned — TEGO resolves it to the Cole Hocker account, no accountId).
 */
const TEGO_SEND_URL = "https://www.tegomarketing.com/api/v1/email/send";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.TEGO_API_KEY;
  if (!apiKey) throw new Error("Missing TEGO_API_KEY environment variable.");

  const res = await fetch(TEGO_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      `TEGO email failed (${res.status}): ${detail?.error?.message ?? "unknown"}`,
    );
  }

  const body = (await res.json()) as { messageId?: string };
  return body.messageId ?? "";
}
```

### Idempotency layer (`sendOnce`)

Since this repo already runs Supabase, add an `email_log` table and wrap
`sendEmail` so a given email fires at most once per logical event:

```sql
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  dedupe_key  text unique not null,   -- e.g. `order-confirmation:${orderId}`
  recipient   text not null,
  subject     text not null,
  message_id  text,
  created_at  timestamptz not null default now()
);
alter table email_log enable row level security;  -- service-role only; no anon policy
```

`sendOnce({ dedupeKey, ... })`: insert the `dedupe_key` first; on a unique-violation,
return early (already sent); otherwise call `sendEmail` and stamp `message_id`.
This is the same pattern as Sorted's `src/lib/email/log.ts`.

## Where to wire it in this repo

| Trigger | File | dedupe_key |
| --- | --- | --- |
| Order paid → confirmation | `src/app/api/webhooks/stripe/route.ts` | `order-confirmation:${sessionId}` |
| Shipped → tracking | `src/app/api/webhooks/shipstation/route.ts` | `shipped:${orderId}` |
| Newsletter opt-in → welcome | `src/components/EmailSignup.tsx` action | `welcome:${email}` |

Webhooks are exactly where idempotency matters — both Stripe and ShipStation
retry, so always go through `sendOnce`.

## Newsletter capture (the "Get Updates" form)

Marketing signups are a different path from transactional sends: they create a
**Contact** on the TEGO email account behind `colehocker.com`, which is the list
a campaign actually sends to.

```
EmailSignup.tsx --POST /api/subscribe--> this app --POST /api/v1/contacts (Bearer key)--> TEGO
```

- Route: `src/app/api/subscribe/route.ts` → `src/lib/subscribe.ts`.
- Auth: `TEGO_CONTACTS_API_KEY` — a **server-only** key scoped `contacts:write`
  and bound to the Cole Hocker account, so no `accountId` travels in the request.
- Every signup is tagged `site-signup`. Upserts by `(account, email)`; tags union
  rather than replace, so re-submitting never drops existing tags.

| Var | Scope | Purpose |
| --- | --- | --- |
| `TEGO_CONTACTS_API_KEY` | server only | Key scoped `contacts:write`, bound to Cole Hocker. |

**Do not** post signups to `https://www.tegomarketing.com/api/webhooks/cole-hocker`.
That is what this form used to do and it was dead for months: the secret it needs
was read from `NEXT_PUBLIC_WEBHOOK_SECRET`, which was never set in Vercel, so the
browser sent an empty header and TEGO answered `401 Missing secret` on every
submit. Worse, that webhook only appends a **site-admin submission** — it never
creates a Contact, so even a working secret would not have built a list. A secret
in a `NEXT_PUBLIC_*` var is also published in the client bundle by definition.

## Gotchas

- **`from` is server-derived** — you cannot set sender name/address from here.
  Change it on the TEGO account, not in code.
- **`html` is required**; `text` is optional but recommended for deliverability.
- **Recording is best-effort** — a 200 means the email was sent even if TEGO's
  internal CRM/analytics write failed. Don't block your flow on it.
- **Don't read open/click *rates*** off the Transactional pseudo-campaign in
  TEGO — repeat sends to one recipient re-stamp a single row, so its aggregate
  counters are a running event total, not a per-recipient rate. Per-send counts
  and suppression are correct.
- **Suppression is automatic** — a hard bounce or complaint suppresses that
  contact in TEGO; you don't manage a suppression list here.
