-- Concepts: Cole submits merch ideas to Kirk to produce; once made, a concept
-- is converted into a real product. Internal/admin only (no anon access).
create table product_concepts (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  notes              text,
  sizes              text,
  target_price_cents integer,
  images             jsonb not null default '[]'::jsonb,
  status             text not null default 'draft'
                       check (status in ('draft','submitted','in_production','published','archived')),
  created_by         text,
  product_id         uuid references products(id) on delete set null,
  kirk_notified_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table product_concepts enable row level security;

create policy "authenticated all concepts" on product_concepts
  for all to authenticated using (true) with check (true);
