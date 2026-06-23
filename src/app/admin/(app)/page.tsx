import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/shop-types";

export const metadata = { title: "Dashboard — Shop Admin" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: orderCount }, paidRes, recentRes] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("total_cents")
        .in("status", ["paid", "fulfilled"]),
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const revenue = (paidRes.data ?? []).reduce(
    (sum, o) => sum + (o.total_cents ?? 0),
    0,
  );
  const recent = (recentRes.data ?? []) as Order[];

  const stats = [
    { label: "Revenue (paid)", value: formatPrice(revenue) },
    { label: "Orders", value: String(orderCount ?? 0) },
    { label: "Products", value: String(productCount ?? 0) },
  ];

  return (
    <div>
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">
        Dashboard
      </h1>

      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-ch-border p-6">
            <div className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              {s.label}
            </div>
            <div className="mt-2 font-display text-3xl uppercase">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-body text-xs uppercase tracking-[0.24em] text-ch-fog">
          Recent orders
        </h2>
        <Link
          href="/admin/orders"
          className="font-body text-xs uppercase tracking-[0.16em] text-ch-gold no-underline"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No orders yet.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {recent.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between py-4 no-underline"
            >
              <div>
                <div className="font-mono text-sm text-white">#{o.order_number}</div>
                <div className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                  {o.email}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-body text-[10px] uppercase tracking-[0.16em] text-ch-muted">
                  {o.status}
                </span>
                <span className="font-mono text-sm">{formatPrice(o.total_cents)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
