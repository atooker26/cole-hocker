import Link from "next/link";
import { getOrders } from "@/lib/db/queries";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders — Shop Admin" };

const FILTERS = ["all", "paid", "fulfilled", "refunded"] as const;

function buildQuery(base: { status: string; q: string; page?: number }) {
  const p = new URLSearchParams();
  if (base.status !== "all") p.set("status", base.status);
  if (base.q) p.set("q", base.q);
  if (base.page && base.page > 1) p.set("page", String(base.page));
  const s = p.toString();
  return s ? `/admin/orders?${s}` : "/admin/orders";
}

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const q = typeof sp.q === "string" ? sp.q : "";
  const page =
    typeof sp.page === "string" ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const { orders, total, pageSize } = await getOrders({
    status: status === "all" ? undefined : status,
    q: q || undefined,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">Orders</h1>
        <span className="font-mono text-xs text-ch-fog">{total} total</span>
      </div>

      <form action="/admin/orders" method="get" className="mb-6 flex gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email or order #"
          className="flex-1 bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]"
        />
        <button
          type="submit"
          className="bg-ch-gold px-4 py-2 font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306]"
        >
          Search
        </button>
        {q && (
          <Link
            href={buildQuery({ status, q: "" })}
            className="self-center font-body text-[11px] uppercase tracking-[0.14em] text-ch-fog no-underline hover:text-white"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="mb-8 flex gap-5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={buildQuery({ status: f, q })}
            className={`font-body text-[11px] uppercase tracking-[0.16em] no-underline ${
              status === f ? "text-ch-gold" : "text-ch-fog hover:text-white"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No orders found.
        </p>
      ) : (
        <>
          <div className="divide-y divide-ch-border border-y border-ch-border">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between py-4 no-underline"
              >
                <div>
                  <div className="font-mono text-sm text-white">
                    #{o.order_number}
                    {o.shopify_order_id && (
                      <span className="ml-2 text-[10px] text-ch-fog">
                        {o.shopify_order_id}
                      </span>
                    )}
                  </div>
                  <div className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                    {o.email}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <span
                    className={`font-body text-[10px] uppercase tracking-[0.16em] ${
                      o.fulfillment_status === "fulfilled"
                        ? "text-ch-green"
                        : "text-ch-muted"
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

          <div className="mt-6 flex items-center justify-between">
            <span className="font-mono text-xs text-ch-fog">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-5">
              {page > 1 && (
                <Link
                  href={buildQuery({ status, q, page: page - 1 })}
                  className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-gold no-underline"
                >
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildQuery({ status, q, page: page + 1 })}
                  className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-gold no-underline"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
