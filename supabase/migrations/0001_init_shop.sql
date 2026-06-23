-- Cole Hocker shop schema (replaces Shopify)
-- Money is stored as integer cents. RLS on for all tables.
-- Storefront reads use the anon key (RLS-limited to active catalog).
-- Admin mutations use an authenticated session. The Stripe webhook uses the
-- service-role key, which bypasses RLS.

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Catalog
-- ----------------------------------------------------------------------------
create table products (
  id                 uuid primary key default gen_random_uuid(),
  handle             text not null unique,
  title              text not null,
  description        text,
  status             text not null default 'draft'
                       check (status in ('active', 'draft', 'archived')),
  images             jsonb not null default '[]'::jsonb,   -- array of public URLs
  shopify_product_id text unique,                          -- migration idempotency
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table variants (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  title              text not null,                        -- size, e.g. "M"
  sku                text,
  price_cents        integer not null check (price_cents >= 0),
  currency           text not null default 'usd',
  position           integer not null default 0,
  shopify_variant_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index variants_product_id_idx on variants(product_id);

create table inventory (
  variant_id uuid primary key references variants(id) on delete cascade,
  quantity   integer not null default 0,
  track      boolean not null default true,               -- false = unlimited (POD)
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Customers & orders
-- ----------------------------------------------------------------------------
create table customers (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  name                text,
  stripe_customer_id  text,
  shopify_customer_id text unique,
  created_at          timestamptz not null default now()
);

create table orders (
  id                          uuid primary key default gen_random_uuid(),
  order_number                bigint generated always as identity,
  customer_id                 uuid references customers(id) on delete set null,
  email                       text not null,
  status                      text not null default 'pending'
                                check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  fulfillment_status          text not null default 'unfulfilled'
                                check (fulfillment_status in ('unfulfilled','fulfilled')),
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  subtotal_cents              integer not null default 0,
  shipping_cents              integer not null default 0,
  total_cents                 integer not null default 0,
  currency                    text not null default 'usd',
  shipping_address            jsonb,
  -- Configurable Connect split (snapshotted at purchase time)
  kirk_pct                    numeric not null default 0,
  kirk_amount_cents           integer not null default 0,
  cole_amount_cents           integer not null default 0,
  platform_amount_cents       integer not null default 0,
  connect_transfer_status     text not null default 'none'
                                check (connect_transfer_status in ('none','pending','transferred')),
  connect_kirk_account_id     text,
  connect_cole_account_id     text,
  shopify_order_id            text unique,
  created_at                  timestamptz not null default now()
);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  variant_id      uuid references variants(id) on delete set null,
  product_title   text not null,                          -- snapshot
  variant_title   text not null,                          -- snapshot
  unit_price_cents integer not null,
  quantity        integer not null check (quantity > 0),
  subtotal_cents  integer not null
);
create index order_items_order_id_idx on order_items(order_id);

-- ----------------------------------------------------------------------------
-- Settings (single row). Connect topology is wired here later with no schema
-- change: fill account ids + flip connect_enabled and transfers begin.
-- ----------------------------------------------------------------------------
create table settings (
  id                       integer primary key default 1 check (id = 1),
  kirk_pct                 numeric not null default 0,
  kirk_connect_account_id  text,
  cole_connect_account_id  text,
  connect_enabled          boolean not null default false,
  notify_email             text,
  updated_at               timestamptz not null default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Atomic inventory decrement (oversell guard). Returns true on success.
-- track=false variants always succeed (unlimited / made-to-order).
-- ----------------------------------------------------------------------------
create or replace function public.decrement_inventory(p_variant_id uuid, p_qty integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_track boolean;
  v_rows  integer;
begin
  select track into v_track from public.inventory where variant_id = p_variant_id for update;
  if not found then
    return false;
  end if;
  if v_track is false then
    return true;
  end if;
  update public.inventory
     set quantity = quantity - p_qty, updated_at = now()
   where variant_id = p_variant_id and quantity >= p_qty;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table products    enable row level security;
alter table variants    enable row level security;
alter table inventory   enable row level security;
alter table customers   enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table settings    enable row level security;

-- Storefront: anon may read the catalog only.
create policy "anon read active products" on products
  for select to anon using (status = 'active');
-- Anon may only read variants/inventory of active products (see 0007).
create policy "anon read variants" on variants
  for select to anon using (
    exists (select 1 from products p where p.id = variants.product_id and p.status = 'active')
  );
create policy "anon read inventory" on inventory
  for select to anon using (
    exists (
      select 1 from variants v join products p on p.id = v.product_id
      where v.id = inventory.variant_id and p.status = 'active'
    )
  );

-- Admin: any authenticated user (we don't allow public signup — only Cole/TEGO
-- accounts exist) has full access. Tighten with an is_admin claim later if needed.
create policy "authenticated all products"    on products    for all to authenticated using (true) with check (true);
create policy "authenticated all variants"     on variants     for all to authenticated using (true) with check (true);
create policy "authenticated all inventory"    on inventory    for all to authenticated using (true) with check (true);
create policy "authenticated all customers"    on customers    for all to authenticated using (true) with check (true);
create policy "authenticated all orders"       on orders       for all to authenticated using (true) with check (true);
create policy "authenticated all order_items"  on order_items  for all to authenticated using (true) with check (true);
create policy "authenticated all settings"     on settings     for all to authenticated using (true) with check (true);
