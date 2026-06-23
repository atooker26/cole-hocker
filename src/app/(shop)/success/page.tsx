import Link from "next/link";
import ClearCart from "./ClearCart";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Order confirmed — Cole Hocker" };

type OrderSummary = {
  order_number: number;
  total_cents: number;
  items: { id: string; product_title: string; variant_title: string; quantity: number }[];
};

async function getOrder(sessionId: string): Promise<OrderSummary | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("orders")
      .select("order_number, total_cents, items:order_items(id, product_title, variant_title, quantity)")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    return (data as OrderSummary | null) ?? null;
  } catch {
    return null;
  }
}

export default async function SuccessPage(props: PageProps<"/success">) {
  const { session_id } = await props.searchParams;
  const order =
    typeof session_id === "string" ? await getOrder(session_id) : null;

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-[100px]">
      <ClearCart />
      <div className="max-w-[520px] text-center">
        <div className="mb-4 font-body text-xs uppercase tracking-[0.32em] font-bold text-ch-gold">
          Order Confirmed
        </div>
        <h1 className="font-display text-[clamp(40px,5vw,64px)] uppercase leading-[0.95] tracking-[-0.005em]">
          Thank You
        </h1>

        {order ? (
          <>
            <p className="mt-6 font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
              Order #{order.order_number} — a confirmation is on its way to your inbox.
            </p>
            <div className="mx-auto mt-8 max-w-[360px] divide-y divide-ch-border border-y border-ch-border text-left">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between py-3">
                  <span className="font-body text-sm text-white">
                    {it.product_title}
                    <span className="text-ch-fog"> · {it.variant_title} ×{it.quantity}</span>
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-3">
                <span className="font-body text-xs uppercase tracking-[0.18em] text-ch-fog">
                  Total
                </span>
                <span className="font-mono text-sm">{formatPrice(order.total_cents)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-6 font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
            Your order is in. A confirmation is on its way to your email, and we&apos;ll
            notify you when it ships.
          </p>
        )}

        <Link
          href="/shop"
          className="mt-10 inline-block font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-white no-underline border-b border-ch-gold pb-1"
        >
          Keep shopping
        </Link>
      </div>
    </main>
  );
}
