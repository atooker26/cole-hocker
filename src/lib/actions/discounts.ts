"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Code: letters, numbers, dashes/underscores only"),
  type: z.enum(["percent", "amount"]),
  value: z.number().positive(),
  maxRedemptions: z.number().int().positive().nullable(),
  expiresAt: z.string().nullable(), // ISO date (yyyy-mm-dd) or null
});

export type DiscountInput = {
  code: string;
  type: "percent" | "amount";
  value: number;
  maxRedemptions: number | null;
  expiresAt: string | null;
};

type Result = { ok: true } | { ok: false; error: string };

export async function createDiscount(input: DiscountInput): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  if (d.type === "percent" && (d.value < 1 || d.value > 100)) {
    return { ok: false, error: "Percent must be between 1 and 100." };
  }
  let expiresAtUnix: number | undefined;
  if (d.expiresAt) {
    const exp = new Date(`${d.expiresAt}T23:59:59`).getTime();
    if (exp <= Date.now()) {
      return { ok: false, error: "Expiry must be in the future." };
    }
    expiresAtUnix = Math.floor(exp / 1000);
  }

  const stripe = getStripe();
  try {
    const coupon = await stripe.coupons.create(
      d.type === "percent"
        ? { percent_off: d.value, duration: "once", name: d.code.toUpperCase() }
        : {
            amount_off: Math.round(d.value * 100),
            currency: "usd",
            duration: "once",
            name: d.code.toUpperCase(),
          },
    );
    try {
      await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: coupon.id },
        code: d.code.toUpperCase(),
        ...(d.maxRedemptions ? { max_redemptions: d.maxRedemptions } : {}),
        ...(expiresAtUnix ? { expires_at: expiresAtUnix } : {}),
      });
    } catch (e) {
      // Don't leave an orphaned coupon behind (e.g. duplicate code).
      await stripe.coupons.del(coupon.id).catch(() => {});
      throw e;
    }
    revalidatePath("/admin/discounts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe error" };
  }
}

export async function deactivateDiscount(promotionCodeId: string): Promise<Result> {
  await requireAdmin();
  try {
    await getStripe().promotionCodes.update(promotionCodeId, { active: false });
    revalidatePath("/admin/discounts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe error" };
  }
}
