"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  orderId: z.string().uuid(),
  fulfilled: z.boolean(),
});

export async function setFulfillment(input: {
  orderId: string;
  fulfilled: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const fulfilled = parsed.data.fulfilled;
  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: fulfilled ? "fulfilled" : "unfulfilled",
      status: fulfilled ? "fulfilled" : "paid",
    })
    .eq("id", parsed.data.orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true };
}
