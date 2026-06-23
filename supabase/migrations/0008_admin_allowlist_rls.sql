-- Gate admin access to an explicit allowlist so a public signup (authenticated
-- but not an admin) has zero data access — security no longer depends on the
-- Supabase "disable signups" toggle. Admins are added via `npm run create:admin`
-- (which inserts the new user into this table); no hardcoded seed here so the
-- migration is reusable across athlete clones.
create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;  -- no policies: only service-role / SECURITY DEFINER reads it

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- Only signed-in users need to evaluate is_admin() (RLS on admin tables); revoke
-- the default PUBLIC grant so anon can't call /rest/v1/rpc/is_admin.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "authenticated all products"   on products;
drop policy if exists "authenticated all variants"    on variants;
drop policy if exists "authenticated all inventory"   on inventory;
drop policy if exists "authenticated all customers"   on customers;
drop policy if exists "authenticated all orders"      on orders;
drop policy if exists "authenticated all order_items" on order_items;
drop policy if exists "authenticated all settings"    on settings;
drop policy if exists "authenticated all concepts"    on product_concepts;

create policy "admin all products"     on products         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all variants"      on variants         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all inventory"     on inventory        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all customers"     on customers        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all orders"        on orders           for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all order_items"   on order_items      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all settings"      on settings         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all concepts"      on product_concepts for all to authenticated using (public.is_admin()) with check (public.is_admin());
