-- Idempotency ledger for transactional email (see docs/EMAIL_SETUP.md).
-- Written only by service-role code (the webhooks); no anon/authenticated policy.
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  dedupe_key  text unique not null,   -- e.g. order-confirmation:${sessionId}
  recipient   text not null,
  subject     text not null,
  message_id  text,
  created_at  timestamptz not null default now()
);
alter table email_log enable row level security;
