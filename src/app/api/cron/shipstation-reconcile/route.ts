import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { shipstationConfigured, listRecentShipments } from "@/lib/shipstation";
import { applyShipmentTracking } from "@/lib/shipstation-sync";

export const runtime = "nodejs";

const WINDOW_DAYS = 7;

/**
 * Reconcile recent ShipStation shipments into orders. Catches tracking edits
 * that ShipStation never pushes via SHIP_NOTIFY (its legacy API has no
 * "shipment edited" event). Runs hourly via Vercel cron (see vercel.json).
 * Authenticated with CRON_SECRET (Vercel sends it as a Bearer token).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  if (!shipstationConfigured()) {
    return Response.json({ ok: true, skipped: "shipstation not configured" });
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // ShipStation expects a date (YYYY-MM-DD)

  const shipments = await listRecentShipments(since);
  const supabase = createAdminClient();

  let changed = 0;
  for (const s of shipments) {
    if (await applyShipmentTracking(supabase, s)) changed++;
  }

  console.log(
    `shipstation reconcile: ${shipments.length} shipments, ${changed} orders updated`,
  );
  if (changed > 0) revalidatePath("/admin/orders");
  return Response.json({ ok: true, shipments: shipments.length, changed });
}
