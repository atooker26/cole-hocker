-- Replace the indoor season (seeded in 0011) with the outdoor closing stretch.
-- The indoor races are done and no longer belong on the homepage Race Calendar.
delete from schedule where event in (
  'Hokie Invitational',
  'Millrose Games',
  'The Sound Invite',
  'USA Indoors',
  'World Indoor Championships'
);

-- `tag` renders as the gold pill on the homepage; distance is the useful signal
-- here since every remaining meet is outdoor.
insert into schedule (event, location, date, tag, status) values
  ('Silesia Diamond League', 'Chorzow, Poland', '2026-08-23', '1500m', 'upcoming'),
  ('Zurich Diamond League', 'Zurich, Switzerland', '2026-08-27', '1500m', 'upcoming'),
  ('Brussels Diamond League Final', 'Brussels, Belgium', '2026-09-04', '1500m', 'upcoming'),
  -- Sep 11-13; the table carries a single date, so the opening day is stored.
  ('Budapest Ultimate World Championships', 'Budapest, Hungary', '2026-09-11', '1500m / 5000m', 'upcoming');
