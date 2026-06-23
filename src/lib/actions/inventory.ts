"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  track: z.boolean(),
});

export async function updateInventory(input: {
  variantId: string;
  quantity: number;
  track: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory")
    .update({
      quantity: parsed.data.quantity,
      track: parsed.data.track,
      updated_at: new Date().toISOString(),
    })
    .eq("variant_id", parsed.data.variantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  return { ok: true };
}
