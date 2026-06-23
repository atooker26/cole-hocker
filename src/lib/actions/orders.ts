"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notifyShipped } from "@/lib/notify";

const schema = z.object({
  orderId: z.string().uuid(),
  fulfilled: z.boolean(),
  tracking_number: z.string().nullish(),
  tracking_carrier: z.string().nullish(),
});

export async function setFulfillment(input: {
  orderId: string;
  fulfilled: boolean;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { orderId, fulfilled } = parsed.data;
  const tracking = parsed.data.tracking_number?.trim() || null;
  const carrier = parsed.data.tracking_carrier?.trim() || null;

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: fulfilled ? "fulfilled" : "unfulfilled",
      status: fulfilled ? "fulfilled" : "paid",
      tracking_number: fulfilled ? tracking : null,
      tracking_carrier: fulfilled ? carrier : null,
    })
    .eq("id", orderId)
    .select("order_number, email")
    .single();
  if (error) return { ok: false, error: error.message };

  // Email the buyer their tracking when newly fulfilled with a number.
  if (fulfilled && tracking && order?.email) {
    await notifyShipped({
      orderNumber: order.order_number,
      email: order.email,
      trackingNumber: tracking,
      carrier,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
