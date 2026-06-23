-- TEGO platform fee: the percentage TEGO keeps from each order subtotal.
-- Kirk gets kirk_pct, TEGO keeps platform_pct, Cole receives the remainder.
alter table settings add column if not exists platform_pct numeric not null default 0;
