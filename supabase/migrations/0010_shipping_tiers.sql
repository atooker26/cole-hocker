-- Configurable tiered shipping (replaces the single shipping_flat_cents in the
-- UI; that column is left in place but unused). Each tier:
-- { name, amount_cents, min_days, max_days }.
alter table settings add column if not exists shipping_tiers jsonb not null default '[]'::jsonb;

-- Seed Cole's three tiers (edit in /admin/settings).
update settings set shipping_tiers = '[
  {"name":"Economy","amount_cents":850,"min_days":5,"max_days":8},
  {"name":"Standard","amount_cents":1500,"min_days":3,"max_days":4},
  {"name":"Express","amount_cents":2000,"min_days":1,"max_days":2}
]'::jsonb
where id = 1 and shipping_tiers = '[]'::jsonb;
