-- Homepage achievement badges + personal bests, managed from
-- /admin/achievements and /admin/personal-bests. Both were hardcoded arrays in
-- the React components; the seeds below are those arrays verbatim (with the
-- U.S. title count corrected to 7×), so applying this migration is a no-op
-- visually and every later edit happens in the admin.
-- Public (anon) read; admin-only writes, same shape as `schedule`.

create table achievements (
  id         uuid primary key default gen_random_uuid(),
  -- Rendered with `whitespace-pre-line`: newlines in `title` are the badge's
  -- line breaks ("Olympic\nChampion"), so the two-line layout stays editable.
  title      text not null,
  subtitle   text not null default '',
  -- Either a bundled asset path (/assets/…-badge.png) or a Storage public URL.
  image_url  text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index achievements_sort_idx on achievements(sort_order);

create table personal_bests (
  id         uuid primary key default gen_random_uuid(),
  event      text not null,
  -- Free text, not an interval: the homepage shows "3:27", "12:57", "1:45".
  time       text not null,
  note       text not null default '',
  -- The one gold-highlighted number in the row.
  highlight  boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index personal_bests_sort_idx on personal_bests(sort_order);

alter table achievements enable row level security;
create policy "anon read achievements" on achievements for select to anon using (true);
create policy "admin all achievements" on achievements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table personal_bests enable row level security;
create policy "anon read personal_bests" on personal_bests for select to anon using (true);
create policy "admin all personal_bests" on personal_bests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public Storage bucket for badge art uploaded from the admin (the bundled
-- /assets PNGs stay in the repo; new badges land here).
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "authenticated upload site images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images');

create policy "authenticated update site images"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-images');

create policy "authenticated delete site images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-images');

insert into achievements (title, subtitle, image_url, sort_order) values
  (E'Olympic\nChampion',      'Paris 2024 · 1500 m',   '/assets/olympic-champion-badge.png',            1),
  (E'World\nChampion',        'Tokyo 2025 · 5000 m',   '/assets/world-champion-badge.png',              2),
  (E'World Indoor\nSilver',   'Glasgow 2024 · 1500 m', '/assets/world-indoor-silver-badge.png',         3),
  (E'World Indoor\nSilver',   'Toruń 2026 · 3000 m',   '/assets/world-indoor-silver-torun-badge.png',   4),
  (E'7×\nU.S. Champion',      'USATF',                 '/assets/us-champion-badge.png',                 5),
  (E'3×\nNCAA Champion',      'Oregon',                '/assets/ncaa-champion-badge.png',               6);

insert into personal_bests (event, time, note, highlight, sort_order) values
  ('800 m',   '1:45',  'Personal Best',          false, 1),
  ('1500 m',  '3:27',  'OR · AR',                true,  2),
  ('1 Mile',  '3:45',  'Indoor American Record', false, 3),
  ('3000 m',  '7:23',  '#2 All-Time Indoor',     false, 4),
  ('5000 m',  '12:57', 'Personal Best',          false, 5);
