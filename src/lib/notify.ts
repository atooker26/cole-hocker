import "server-only";

import { sendOnce } from "@/lib/email/log";
import {
  orderConfirmationEmail,
  shippedEmail,
  kirkOrderEmail,
  kirkConceptEmail,
  type EmailItem,
} from "@/lib/email/templates";

/**
 * Notification helpers. Each builds a branded email and routes it through the
 * idempotent sendOnce() relay (TEGO SES). All best-effort — never throw, and
 * no-op until TEGO_API_KEY is set.
 */

/** Buyer order confirmation. dedupeKey e.g. `order-confirmation:${sessionId}`. */
export async function notifyCustomer(o: {
  dedupeKey: string;
  orderNumber: number;
  email: string;
  items: EmailItem[];
  totalCents: number;
}): Promise<void> {
  if (!o.email) return;
  await sendOnce({ to: o.email, dedupeKey: o.dedupeKey, ...orderConfirmationEmail(o) });
}

/** Fulfillment notice to Kirk. dedupeKey e.g. `new-order-kirk:${sessionId}`. */
export async function notifyKirk(o: {
  dedupeKey: string;
  orderNumber: number;
  email: string;
  items: EmailItem[];
  shippingAddress: Record<string, unknown> | null;
}): Promise<void> {
  const to = process.env.KIRK_NOTIFY_EMAIL;
  if (!to) return;
  await sendOnce({ to, dedupeKey: o.dedupeKey, ...kirkOrderEmail(o) });
}

/** Buyer shipped/tracking email. dedupeKey e.g. `shipped:${orderId}`. */
export async function notifyShipped(o: {
  dedupeKey: string;
  orderNumber: number;
  email: string;
  trackingNumber: string;
  carrier: string | null;
}): Promise<void> {
  if (!o.email) return;
  await sendOnce({ to: o.email, dedupeKey: o.dedupeKey, ...shippedEmail(o) });
}

/** Concept brief to Kirk. dedupeKey e.g. `concept:${id}:${updatedAt}`. */
export async function notifyKirkConcept(c: {
  dedupeKey: string;
  title: string;
  notes: string | null;
  sizes: string | null;
  targetPriceCents: number | null;
  images: string[];
  submittedBy: string | null;
}): Promise<void> {
  const to = process.env.KIRK_NOTIFY_EMAIL;
  if (!to) return;
  await sendOnce({ to, dedupeKey: c.dedupeKey, ...kirkConceptEmail(c) });
}
