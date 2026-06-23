/**
 * All shop emails route through the TEGO webhook, which sends them via TEGO's
 * AWS/SES pipeline. Best-effort — these never throw, so a notification failure
 * can't fail the Stripe webhook.
 */
type OrderNotification = {
  orderNumber: number;
  email: string;
  items: { title: string; variant: string; quantity: number }[];
  shippingAddress: Record<string, unknown> | null;
  totalCents: number;
};

/** Notify Kirk (the fulfiller) of a paid order. */
export async function notifyKirk(order: OrderNotification): Promise<void> {
  try {
    await fetch("https://www.tegomarketing.com/api/webhooks/cole-hocker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({
        formType: "shop-order",
        to: process.env.KIRK_NOTIFY_EMAIL ?? null,
        ...order,
      }),
    });
  } catch (err) {
    console.error("notifyKirk failed:", err);
  }
}

/**
 * Send the buyer an order confirmation. Routed through the TEGO webhook (same
 * pattern as the email-signup form) so it uses TEGO's existing email pipeline —
 * no extra provider key needed. Best-effort; never throws.
 */
export async function notifyCustomer(order: {
  orderNumber: number;
  email: string;
  items: { title: string; variant: string; quantity: number }[];
  totalCents: number;
}): Promise<void> {
  if (!order.email) return;
  try {
    await fetch("https://www.tegomarketing.com/api/webhooks/cole-hocker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ formType: "order-confirmation", ...order }),
    });
  } catch (err) {
    console.error("notifyCustomer failed:", err);
  }
}

/** Email Kirk a new product concept brief. Best-effort. */
export async function notifyKirkConcept(concept: {
  title: string;
  notes: string | null;
  sizes: string | null;
  targetPriceCents: number | null;
  images: string[];
  submittedBy: string | null;
}): Promise<void> {
  try {
    await fetch("https://www.tegomarketing.com/api/webhooks/cole-hocker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ formType: "product-concept", ...concept }),
    });
  } catch (err) {
    console.error("notifyKirkConcept failed:", err);
  }
}

/** Email the buyer their tracking when an order ships. Best-effort. */
export async function notifyShipped(order: {
  orderNumber: number;
  email: string;
  trackingNumber: string;
  carrier: string | null;
}): Promise<void> {
  if (!order.email) return;
  try {
    await fetch("https://www.tegomarketing.com/api/webhooks/cole-hocker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ formType: "order-shipped", ...order }),
    });
  } catch (err) {
    console.error("notifyShipped failed:", err);
  }
}
