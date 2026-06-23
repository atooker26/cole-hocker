import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchShipments } from "@/lib/shipstation";
import { notifyShipped } from "@/lib/notify";

export const runtime = "nodejs";

/**
 * ShipStation SHIP_NOTIFY webhook. ShipStation posts { resource_url,
 * resource_type }; we fetch the shipments and write tracking back to the order.
 * Secured by a shared token in the query string (ShipStation doesn't sign
 * webhooks), set via SHIPSTATION_WEBHOOK_TOKEN and baked into the subscribed URL.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const expected = process.env.SHIPSTATION_WEBHOOK_TOKEN;
  if (!expected || token !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    resource_url?: string;
    resource_type?: string;
  } | null;
  if (!body?.resource_url || body.resource_type !== "SHIP_NOTIFY") {
    return new Response("ok", { status: 200 });
  }

  const shipments = await fetchShipments(body.resource_url);
  const supabase = createAdminClient();

  for (const s of shipments) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, email, fulfillment_status")
      .eq("shipstation_order_id", s.orderId)
      .maybeSingle();
    if (!order) continue;

    await supabase
      .from("orders")
      .update({
        fulfillment_status: "fulfilled",
        status: "fulfilled",
        tracking_number: s.trackingNumber,
        tracking_carrier: s.carrierCode,
      })
      .eq("id", order.id);

    if (s.trackingNumber && order.email && order.fulfillment_status !== "fulfilled") {
      await notifyShipped({
        orderNumber: order.order_number,
        email: order.email,
        trackingNumber: s.trackingNumber,
        carrier: s.carrierCode,
      });
    }
  }

  revalidatePath("/admin/orders");
  return new Response("ok", { status: 200 });
}
