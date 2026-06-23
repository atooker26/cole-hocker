"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { ShippingTier } from "@/lib/shop-types";
import type { Json } from "@/lib/database.types";

const schema = z
  .object({
    kirk_pct: z.number().min(0).max(100),
    platform_pct: z.number().min(0).max(100),
    kirk_connect_account_id: z.string().nullish(),
    cole_connect_account_id: z.string().nullish(),
    connect_enabled: z.boolean(),
    notify_email: z.string().email().nullish().or(z.literal("")),
    shipping_tiers: z.array(
      z.object({
        name: z.string().min(1),
        amount_cents: z.number().int().nonnegative(),
        min_days: z.number().int().nonnegative(),
        max_days: z.number().int().nonnegative(),
      }),
    ),
    free_shipping_threshold_cents: z.number().int().nonnegative(),
  })
  .refine((d) => d.kirk_pct + d.platform_pct <= 100, {
    message: "Kirk % + TEGO % cannot exceed 100",
  });

export async function updateSettings(input: {
  kirk_pct: number;
  platform_pct: number;
  kirk_connect_account_id?: string | null;
  cole_connect_account_id?: string | null;
  connect_enabled: boolean;
  notify_email?: string | null;
  shipping_tiers: ShippingTier[];
  free_shipping_threshold_cents: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      kirk_pct: d.kirk_pct,
      platform_pct: d.platform_pct,
      kirk_connect_account_id: d.kirk_connect_account_id || null,
      cole_connect_account_id: d.cole_connect_account_id || null,
      connect_enabled: d.connect_enabled,
      notify_email: d.notify_email || null,
      shipping_tiers: d.shipping_tiers as unknown as Json,
      free_shipping_threshold_cents: d.free_shipping_threshold_cents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}
