-- Fulfillment tracking (manual entry now; populated by ShipStation later).
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists tracking_carrier text;
alter table orders add column if not exists shipstation_order_id text;
