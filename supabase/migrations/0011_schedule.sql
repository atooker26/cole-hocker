-- Race schedule, managed from /admin/schedule and rendered on the homepage.
-- Public (anon) read; admin-only writes. Replaces the TEGO schedule API as the
-- source of truth for this site.
create table schedule (
  id         uuid primary key default gen_random_uuid(),
  event      text not null,
  location   text not null default '',
  date       date not null,
  tag        text not null default '',
  result     text,
  status     text not null default 'upcoming' check (status in ('upcoming','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index schedule_date_idx on schedule(date);

alter table schedule enable row level security;
create policy "anon read schedule" on schedule for select to anon using (true);
create policy "admin all schedule" on schedule
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the current season (was served from the TEGO API).
insert into schedule (event, location, date, tag, status) values
  ('Hokie Invitational', 'Blacksburg, VA', '2026-01-23', 'Indoor', 'completed'),
  ('Millrose Games', 'New York, NY', '2026-02-01', 'Indoor', 'completed'),
  ('The Sound Invite', 'North Carolina', '2026-02-14', 'Indoor', 'completed'),
  ('USA Indoors', 'New York, NY', '2026-02-28', 'Championship', 'completed'),
  ('World Indoor Championships', 'Poland', '2026-03-20', 'Championship', 'completed');
