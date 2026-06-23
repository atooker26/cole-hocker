import Link from "next/link";
import { getOrders } from "@/lib/db/queries";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders — Shop Admin" };

const FILTERS = ["all", "paid", "fulfilled", "refunded"] as const;

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  const { status } = await props.searchParams;
  const active = typeof status === "string" ? status : "all";
  const orders = await getOrders(active === "all" ? undefined : active);

  return (
    <div>
      <h1 className="mb-6 font-display text-4xl uppercase tracking-[-0.01em]">Orders</h1>

      <div className="mb-8 flex gap-5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={`font-body text-[11px] uppercase tracking-[0.16em] no-underline ${
              active === f ? "text-ch-gold" : "text-ch-fog hover:text-white"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No orders yet.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {orders.map((o) => (
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
              <div className="flex items-center gap-5">
                <span
                  className={`font-body text-[10px] uppercase tracking-[0.16em] ${
                    o.fulfillment_status === "fulfilled" ? "text-ch-green" : "text-ch-muted"
                  }`}
                >
                  {o.fulfillment_status}
                </span>
                <span className="font-body text-[10px] uppercase tracking-[0.16em] text-ch-fog">
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
