/**
 * ShipStation integration (legacy ssapi order-management API).
 *
 * Two directions:
 *  - push: when an order is paid, create it in ShipStation so Kirk can buy a
 *    label (createShipstationOrder, called from the Stripe webhook).
 *  - pull: ShipStation calls our webhook on SHIP_NOTIFY; we fetch the shipments
 *    and write tracking back (fetchShipments).
 *
 * Inert until SHIPSTATION_API_KEY + SHIPSTATION_API_SECRET are set.
 */
const BASE = "https://ssapi.shipstation.com";

function authHeader(): string | null {
  const key = process.env.SHIPSTATION_API_KEY;
  const secret = process.env.SHIPSTATION_API_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export function shipstationConfigured(): boolean {
  return authHeader() !== null;
}

export type ShipstationOrderInput = {
  orderNumber: string;
  orderDate: string; // ISO
  email: string;
  amountPaidCents: number;
  shippingAddress: Record<string, unknown> | null;
  items: {
    name: string;
    quantity: number;
    unitPriceCents: number;
    sku?: string | null;
  }[];
};

/** Create the order in ShipStation; returns its orderId (string) or null. */
export async function createShipstationOrder(
  input: ShipstationOrderInput,
): Promise<string | null> {
  const auth = authHeader();
  if (!auth) return null;

  const a = (input.shippingAddress ?? {}) as Record<string, string>;
  const shipTo = {
    name: a.name || "Customer",
    street1: a.line1 || "",
    street2: a.line2 || null,
    city: a.city || "",
    state: a.state || "",
    postalCode: a.postal_code || "",
    country: a.country || "US",
  };

  const body = {
    orderNumber: input.orderNumber,
    orderDate: input.orderDate,
    orderStatus: "awaiting_shipment",
    customerEmail: input.email,
    billTo: { name: shipTo.name },
    shipTo,
    items: input.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPriceCents / 100,
      sku: i.sku ?? undefined,
    })),
    amountPaid: input.amountPaidCents / 100,
  };

  try {
    const res = await fetch(`${BASE}/orders/createorder`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("shipstation createorder failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { orderId?: number | string };
    return data.orderId != null ? String(data.orderId) : null;
  } catch (err) {
    console.error("shipstation createorder error", err);
    return null;
  }
}

export type ShipstationShipment = {
  orderId: string;
  trackingNumber: string | null;
  carrierCode: string | null;
};

/** Fetch shipments from a SHIP_NOTIFY resource_url. */
export async function fetchShipments(
  resourceUrl: string,
): Promise<ShipstationShipment[]> {
  const auth = authHeader();
  if (!auth) return [];
  try {
    const res = await fetch(resourceUrl, { headers: { Authorization: auth } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      shipments?: {
        orderId: number | string;
        trackingNumber?: string | null;
        carrierCode?: string | null;
      }[];
    };
    return (data.shipments ?? []).map((s) => ({
      orderId: String(s.orderId),
      trackingNumber: s.trackingNumber ?? null,
      carrierCode: s.carrierCode ?? null,
    }));
  } catch (err) {
    console.error("shipstation fetchShipments error", err);
    return [];
  }
}
