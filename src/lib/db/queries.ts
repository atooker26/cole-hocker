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

export async function getOrders(opts: {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ orders: Order[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 50;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status);

  if (opts.q) {
    // Sanitize so user input can't break the PostgREST or() filter syntax.
    const safe = opts.q.trim().replace(/[^a-zA-Z0-9@._#\- ]/g, "");
    if (safe) {
      const like = safe.replace(/[%_]/g, (m) => `\\${m}`); // escape LIKE wildcards
      const digits = safe.replace(/^#/, ""); // also match the displayed #-number
      const numeric = /^\d+$/.test(digits) ? `,order_number.eq.${digits}` : "";
      query = query.or(
        `email.ilike.%${like}%,shopify_order_id.ilike.%${like}%${numeric}`,
      );
    }
  }

  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { orders: (data ?? []) as Order[], total: count ?? 0, page, pageSize };
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
