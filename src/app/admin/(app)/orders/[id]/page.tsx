import { notFound } from "next/navigation";
import FulfillButton from "@/components/admin/FulfillButton";
import { getOrder } from "@/lib/db/queries";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Order — Shop Admin" };

function AddressBlock({ address }: { address: Record<string, unknown> | null }) {
  if (!address) return null;
  const a = address as Record<string, string>;
  const lines = [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(", "),
    a.country,
  ].filter(Boolean);
  return (
    <div className="font-body text-sm leading-relaxed text-ch-muted">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

export default async function OrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  const { id } = await props.params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="max-w-[720px]">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">
            #{order.order_number}
          </h1>
          <div className="mt-2 font-narrow text-xs uppercase tracking-[0.12em] text-ch-fog">
            {order.email} · {order.status}
          </div>
        </div>
        {(order.status === "paid" || order.status === "fulfilled") && (
          <FulfillButton
            orderId={order.id}
            fulfilled={order.fulfillment_status === "fulfilled"}
          />
        )}
      </div>

      <div className="divide-y divide-ch-border border-y border-ch-border">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-body text-sm text-white">{it.product_title}</div>
              <div className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                {it.variant_title} · ×{it.quantity}
              </div>
            </div>
            <div className="font-mono text-sm">{formatPrice(it.subtotal_cents)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-1 text-right font-mono text-sm">
        <div className="text-ch-fog">
          Subtotal <span className="ml-4 text-white">{formatPrice(order.subtotal_cents)}</span>
        </div>
        <div className="text-ch-fog">
          Shipping <span className="ml-4 text-white">{formatPrice(order.shipping_cents)}</span>
        </div>
        <div className="text-base">
          Total <span className="ml-4 font-bold">{formatPrice(order.total_cents)}</span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 border-t border-ch-border pt-8 sm:grid-cols-2">
        <div>
          <div className="mb-3 font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Ship to
          </div>
          <AddressBlock address={order.shipping_address} />
        </div>
        <div>
          <div className="mb-3 font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Revenue split
          </div>
          <div className="flex flex-col gap-1 font-mono text-sm">
            <div className="text-ch-fog">
              Kirk ({order.kirk_pct}%){" "}
              <span className="ml-3 text-white">{formatPrice(order.kirk_amount_cents)}</span>
            </div>
            <div className="text-ch-fog">
              Cole <span className="ml-3 text-white">{formatPrice(order.cole_amount_cents)}</span>
            </div>
            {order.platform_amount_cents > 0 && (
              <div className="text-ch-fog">
                Platform{" "}
                <span className="ml-3 text-white">
                  {formatPrice(order.platform_amount_cents)}
                </span>
              </div>
            )}
            <div className="mt-1 text-[11px] text-ch-fog">
              Transfers: {order.connect_transfer_status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
