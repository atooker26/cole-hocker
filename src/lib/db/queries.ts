import { createClient } from "@/lib/supabase/server";
import type {
  Order,
  OrderItem,
  ProductWithVariants,
  Settings,
} from "@/lib/shop-types";

const PRODUCT_WITH_VARIANTS =
  "*, variants(*, inventory(quantity, track))" as const;

function sortVariants(p: ProductWithVariants): ProductWithVariants {
  return { ...p, variants: [...p.variants].sort((a, b) => a.position - b.position) };
}

/** Storefront: active products only (RLS also enforces this for anon). */
export async function getActiveProducts(): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_VARIANTS)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ProductWithVariants[]).map(sortVariants);
}

export async function getProductByHandle(
  handle: string,
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_VARIANTS)
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return data ? sortVariants(data as unknown as ProductWithVariants) : null;
}

/** Admin: all products regardless of status. Requires an authenticated session. */
export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_VARIANTS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ProductWithVariants[]).map(sortVariants);
}

export async function getProductById(
  id: string,
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_VARIANTS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? sortVariants(data as unknown as ProductWithVariants) : null;
}

export async function getOrders(status?: string): Promise<Order[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
}

export async function getOrder(
  id: string,
): Promise<(Order & { items: OrderItem[] }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as (Order & { items: OrderItem[] }) | null;
}

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data as Settings;
}
