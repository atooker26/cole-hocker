-- Anon may only read variants/inventory of ACTIVE products (was using(true),
-- which leaked draft/archived variant prices + stock via the public anon key).
drop policy if exists "anon read variants" on variants;
create policy "anon read variants" on variants
  for select to anon using (
    exists (
      select 1 from products p
      where p.id = variants.product_id and p.status = 'active'
    )
  );

drop policy if exists "anon read inventory" on inventory;
create policy "anon read inventory" on inventory
  for select to anon using (
    exists (
      select 1 from variants v
      join products p on p.id = v.product_id
      where v.id = inventory.variant_id and p.status = 'active'
    )
  );
