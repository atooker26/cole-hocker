/**
 * Notify Kirk (the fulfiller) of a paid order. Best-effort — never throws, so a
 * notification failure can't fail the Stripe webhook. Uses Resend if configured,
 * otherwise falls back to the existing TEGO webhook used elsewhere on the site.
 */
type OrderNotification = {
  orderNumber: number;
  email: string;
  items: { title: string; variant: string; quantity: number }[];
  shippingAddress: Record<string, unknown> | null;
  totalCents: number;
};

export async function notifyKirk(order: OrderNotification): Promise<void> {
  const to = process.env.KIRK_NOTIFY_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  const lines = order.items
    .map((i) => `• ${i.quantity}× ${i.title} (${i.variant})`)
    .join("\n");
  const addr = order.shippingAddress
    ? Object.values(order.shippingAddress).filter(Boolean).join(", ")
    : "(no address)";
  const text = `New order #${order.orderNumber}\n\n${lines}\n\nShip to: ${addr}\nCustomer: ${order.email}`;

  try {
    if (to && resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Cole Hocker Shop <orders@tegomarketing.com>",
          to: [to],
          subject: `New order #${order.orderNumber}`,
          text,
        }),
      });
      return;
    }

    // Fallback: post to the TEGO webhook (same pattern as the email signup form).
    await fetch("https://www.tegomarketing.com/api/webhooks/cole-hocker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ formType: "shop-order", ...order }),
    });
  } catch (err) {
    console.error("notifyKirk failed:", err);
  }
}
