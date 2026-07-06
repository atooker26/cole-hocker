import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ShipstationShipment } from "@/lib/shipstation";
import { notifyShipped } from "@/lib/notify";

type Admin = SupabaseClient<Database>;

/**
 * Write a ShipStation shipment's tracking back to its order. Shared by the
 * SHIP_NOTIFY webhook and the reconcile cron so both behave identically.
 *
 * Matches by `shipstation_order_id`, falling back to `order_number` when the
 * push never recorded an id (or the order was created directly in ShipStation).
 * Overwrites tracking every time; only emails the customer on the first ship.
 * Returns true when the order's tracking actually changed.
 */
export async function applyShipmentTracking(
  supabase: Admin,
  s: ShipstationShipment,
): Promise<boolean> {
  if (s.voided) return false;

  let order:
    | {
        id: string;
        order_number: number;
        email: string | null;
        fulfillment_status: string | null;
        tracking_number: string | null;
      }
    | null = null;

  if (s.orderId) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, email, fulfillment_status, tracking_number")
      .eq("shipstation_order_id", s.orderId)
      .maybeSingle();
    order = data ?? null;
  }
  if (!order && s.orderNumber && /^\d+$/.test(s.orderNumber)) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, email, fulfillment_status, tracking_number")
      .eq("order_number", Number(s.orderNumber))
      .maybeSingle();
    order = data ?? null;
  }
  if (!order) return false;

  const changed = order.tracking_number !== s.trackingNumber;

  const update: Database["public"]["Tables"]["orders"]["Update"] = {
    tracking_number: s.trackingNumber,
    tracking_carrier: s.carrierCode,
  };
  if (s.trackingNumber) {
    update.fulfillment_status = "fulfilled";
    update.status = "fulfilled";
  }
  await supabase.from("orders").update(update).eq("id", order.id);

  if (s.trackingNumber && order.email && order.fulfillment_status !== "fulfilled") {
    await notifyShipped({
      dedupeKey: `shipped:${order.id}`,
      orderNumber: order.order_number,
      email: order.email,
      trackingNumber: s.trackingNumber,
      carrier: s.carrierCode,
    });
  }

  return changed;
}
