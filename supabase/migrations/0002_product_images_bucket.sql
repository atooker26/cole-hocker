-- Public Storage bucket for product images + write policies for admins.
-- (Public buckets serve object URLs without a SELECT policy, so none is added —
-- that also avoids exposing a bucket-wide file listing.)

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "authenticated upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "authenticated update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

create policy "authenticated delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');
