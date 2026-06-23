-- Configurable flat-rate shipping. 0 = free/unset. free_shipping_threshold_cents
-- of 0 disables the free-over-threshold rule.
alter table settings add column if not exists shipping_flat_cents integer not null default 0;
alter table settings add column if not exists free_shipping_threshold_cents integer not null default 0;
