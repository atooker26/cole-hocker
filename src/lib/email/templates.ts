import { formatPrice } from "@/lib/format";

export type EmailItem = { title: string; variant: string; quantity: number };
export type BuiltEmail = { subject: string; html: string; text: string };

const GOLD = "#C9A24B";
const BG = "#0B0B0C";
const CARD = "#141416";
const TEXT = "#F2EFE7";
const MUTED = "#9b9ba0";

/** Branded shell so every send looks like Cole Hocker. */
function shell(opts: {
  preheader: string;
  heading: string;
  body: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:${BG};padding:24px 0;font-family:Helvetica,Arial,sans-serif;color:${TEXT}">
<span style="display:none;opacity:0;color:transparent">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="padding:8px 24px 24px">
<div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};font-weight:800">Cole Hocker</div>
</td></tr>
<tr><td style="background:${CARD};border-radius:8px;padding:32px 28px">
<h1 style="margin:0 0 16px;font-size:24px;text-transform:uppercase;letter-spacing:-0.5px;color:${TEXT}">${opts.heading}</h1>
${opts.body}
</td></tr>
<tr><td style="padding:20px 24px;color:${MUTED};font-size:12px;line-height:1.6">
Cole Hocker · <a href="https://colehocker.com/shop" style="color:${MUTED}">colehocker.com/shop</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(items: EmailItem[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;color:${TEXT};font-size:14px">${i.title} <span style="color:${MUTED}">· ${i.variant}</span></td><td align="right" style="padding:8px 0;color:${MUTED};font-size:14px">×${i.quantity}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" style="border-top:1px solid #26262a;border-bottom:1px solid #26262a;margin:8px 0">${rows}</table>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${GOLD};color:#1A1306;text-decoration:none;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;font-size:13px;padding:14px 22px;border-radius:4px;margin-top:8px">${text}</a>`;
}

export function orderConfirmationEmail(o: {
  orderNumber: number;
  items: EmailItem[];
  totalCents: number;
}): BuiltEmail {
  const itemsText = o.items.map((i) => `- ${i.quantity}x ${i.title} (${i.variant})`).join("\n");
  return {
    subject: `Order #${o.orderNumber} confirmed`,
    html: shell({
      preheader: `Your Cole Hocker order #${o.orderNumber} is confirmed.`,
      heading: "Thank you",
      body: `<p style="color:${MUTED};font-size:14px;line-height:1.6;margin:0 0 8px">Order #${o.orderNumber} is confirmed. We'll email tracking when it ships.</p>
        ${itemsTable(o.items)}
        <p style="font-size:15px;color:${TEXT};margin:12px 0 20px"><strong>Total</strong> &nbsp; ${formatPrice(o.totalCents)}</p>
        ${button("Shop more", "https://colehocker.com/shop")}`,
    }),
    text: `Thank you — order #${o.orderNumber} confirmed.\n\n${itemsText}\n\nTotal: ${formatPrice(o.totalCents)}`,
  };
}

export function shippedEmail(o: {
  orderNumber: number;
  trackingNumber: string;
  carrier: string | null;
}): BuiltEmail {
  const carrier = o.carrier ? `${o.carrier} ` : "";
  return {
    subject: `Order #${o.orderNumber} has shipped`,
    html: shell({
      preheader: `Your order #${o.orderNumber} is on the way.`,
      heading: "It's on the way",
      body: `<p style="color:${MUTED};font-size:14px;line-height:1.6;margin:0 0 12px">Order #${o.orderNumber} has shipped.</p>
        <p style="font-size:15px;color:${TEXT};margin:0 0 20px">Tracking: <strong>${carrier}${o.trackingNumber}</strong></p>`,
    }),
    text: `Order #${o.orderNumber} has shipped.\nTracking: ${carrier}${o.trackingNumber}`,
  };
}

export function kirkOrderEmail(o: {
  orderNumber: number;
  email: string;
  items: EmailItem[];
  shippingAddress: Record<string, unknown> | null;
}): BuiltEmail {
  const addr = o.shippingAddress
    ? Object.values(o.shippingAddress).filter(Boolean).join(", ")
    : "(no address)";
  const itemsText = o.items.map((i) => `- ${i.quantity}x ${i.title} (${i.variant})`).join("\n");
  return {
    subject: `New order #${o.orderNumber} to fulfill`,
    html: shell({
      preheader: `New Cole Hocker order #${o.orderNumber} to fulfill.`,
      heading: `New order #${o.orderNumber}`,
      body: `${itemsTable(o.items)}
        <p style="font-size:14px;color:${TEXT};margin:12px 0 4px"><strong>Ship to</strong></p>
        <p style="font-size:14px;color:${MUTED};margin:0 0 8px">${addr}</p>
        <p style="font-size:13px;color:${MUTED};margin:0">Customer: ${o.email}</p>`,
    }),
    text: `New order #${o.orderNumber}\n\n${itemsText}\n\nShip to: ${addr}\nCustomer: ${o.email}`,
  };
}

export function kirkConceptEmail(c: {
  title: string;
  notes: string | null;
  sizes: string | null;
  targetPriceCents: number | null;
  images: string[];
  submittedBy: string | null;
}): BuiltEmail {
  const imgs = c.images
    .map((src) => `<img src="${src}" alt="" style="max-width:140px;border-radius:4px;margin:4px" />`)
    .join("");
  const price = c.targetPriceCents != null ? formatPrice(c.targetPriceCents) : "—";
  return {
    subject: `New product concept: ${c.title}`,
    html: shell({
      preheader: `New merch concept from Cole Hocker: ${c.title}`,
      heading: c.title,
      body: `<p style="color:${MUTED};font-size:13px;margin:0 0 12px">Target price ${price}${c.sizes ? ` · Sizes ${c.sizes}` : ""}</p>
        ${c.notes ? `<p style="color:${TEXT};font-size:14px;line-height:1.6;white-space:pre-line">${c.notes}</p>` : ""}
        <div style="margin-top:12px">${imgs}</div>
        ${c.submittedBy ? `<p style="color:${MUTED};font-size:12px;margin-top:12px">From ${c.submittedBy}</p>` : ""}`,
    }),
    text: `New concept: ${c.title}\nTarget price: ${price}\nSizes: ${c.sizes ?? "—"}\n\n${c.notes ?? ""}\n\nImages:\n${c.images.join("\n")}`,
  };
}
