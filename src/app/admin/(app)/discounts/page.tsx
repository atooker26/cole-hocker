import DiscountForm from "@/components/admin/DiscountForm";
import DiscountList, { type DiscountRow } from "@/components/admin/DiscountList";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Discounts — Shop Admin" };

async function listDiscounts(): Promise<DiscountRow[]> {
  try {
    const stripe = getStripe();
    const promos = await stripe.promotionCodes.list({
      limit: 50,
      expand: ["data.promotion.coupon"],
    });
    return promos.data.map((p) => {
      const c =
        typeof p.promotion?.coupon === "object" && p.promotion.coupon
          ? p.promotion.coupon
          : null;
      const discount =
        c?.percent_off != null
          ? `${c.percent_off}% off`
          : c?.amount_off != null
            ? `${formatPrice(c.amount_off, c.currency ?? "usd")} off`
            : "—";
      return {
        id: p.id,
        code: p.code,
        discount,
        active: p.active,
        timesRedeemed: p.times_redeemed,
        maxRedemptions: p.max_redemptions ?? null,
        expiresAt: p.expires_at
          ? new Date(p.expires_at * 1000).toISOString().slice(0, 10)
          : null,
      };
    });
  } catch {
    return [];
  }
}

export default async function DiscountsPage() {
  const discounts = await listDiscounts();

  return (
    <div>
      <h1 className="mb-2 font-display text-4xl uppercase tracking-[-0.01em]">Discounts</h1>
      <p className="mb-8 font-narrow text-xs uppercase tracking-[0.14em] text-ch-fog">
        Codes customers enter at checkout (Stripe promotion codes)
      </p>
      <DiscountForm />
      <div className="mt-10">
        <DiscountList discounts={discounts} />
      </div>
    </div>
  );
}
