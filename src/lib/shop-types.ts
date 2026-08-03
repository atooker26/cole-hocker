/**
 * Hand-written row types mirroring supabase/migrations/0001_init_shop.sql.
 * Once the Supabase project exists, replace/augment these with generated types:
 *   supabase gen types typescript --linked > src/lib/database.types.ts
 */

export type ProductStatus = "active" | "draft" | "archived";
export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";
export type FulfillmentStatus = "unfulfilled" | "fulfilled";
export type ConnectTransferStatus = "none" | "pending" | "transferred";

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  status: ProductStatus;
  images: string[];
  shopify_product_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Variant = {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price_cents: number;
  currency: string;
  position: number;
  shopify_variant_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Inventory = {
  variant_id: string;
  quantity: number;
  track: boolean;
  updated_at: string;
};

export type Customer = {
  id: string;
  email: string;
  name: string | null;
  stripe_customer_id: string | null;
  shopify_customer_id: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: number;
  customer_id: string | null;
  email: string;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  kirk_pct: number;
  kirk_amount_cents: number;
  cole_amount_cents: number;
  platform_amount_cents: number;
  connect_transfer_status: ConnectTransferStatus;
  connect_kirk_account_id: string | null;
  connect_cole_account_id: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipstation_order_id: string | null;
  shopify_order_id: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_title: string;
  variant_title: string;
  unit_price_cents: number;
  quantity: number;
  subtotal_cents: number;
};

export type ScheduleStatus = "upcoming" | "completed";

export type ScheduleEntry = {
  id: string;
  event: string;
  location: string;
  date: string; // YYYY-MM-DD
  tag: string;
  result: string | null;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
};

export type Achievement = {
  id: string;
  title: string; // newlines are the badge's line breaks
  subtitle: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PersonalBest = {
  id: string;
  event: string;
  time: string;
  note: string;
  highlight: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ShippingTier = {
  name: string;
  amount_cents: number;
  min_days: number;
  max_days: number;
};

export type Settings = {
  id: number;
  kirk_pct: number;
  platform_pct: number;
  kirk_connect_account_id: string | null;
  cole_connect_account_id: string | null;
  connect_enabled: boolean;
  notify_email: string | null;
  shipping_flat_cents: number;
  free_shipping_threshold_cents: number;
  shipping_tiers: ShippingTier[];
  updated_at: string;
};

export type ConceptStatus =
  | "draft"
  | "submitted"
  | "in_production"
  | "published"
  | "archived";

export type Concept = {
  id: string;
  title: string;
  notes: string | null;
  sizes: string | null;
  target_price_cents: number | null;
  images: string[];
  status: ConceptStatus;
  created_by: string | null;
  product_id: string | null;
  kirk_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

/** A product joined with its variants + per-variant stock, for storefront/admin. */
export type ProductWithVariants = Product & {
  variants: (Variant & { inventory: Pick<Inventory, "quantity" | "track"> | null })[];
};
