import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, type SendEmailInput } from "@/lib/email/send";

/**
 * Idempotent transactional send. Reserves the dedupe_key first; a unique
 * violation means it already fired (Stripe/ShipStation webhooks retry), so we
 * no-op. Best-effort: never throws — a notification must not fail the webhook.
 * On send failure the reservation is rolled back so a retry can try again.
 */
export async function sendOnce(
  input: SendEmailInput & { dedupeKey: string },
): Promise<void> {
  if (!process.env.TEGO_API_KEY) return; // relay not configured yet

  const supabase = createAdminClient();
  const { error: reserveError } = await supabase.from("email_log").insert({
    dedupe_key: input.dedupeKey,
    recipient: input.to,
    subject: input.subject,
  });
  if (reserveError) return; // unique violation (already sent) or DB issue → skip

  try {
    const messageId = await sendEmail(input);
    await supabase
      .from("email_log")
      .update({ message_id: messageId })
      .eq("dedupe_key", input.dedupeKey);
  } catch (err) {
    console.error("sendOnce failed:", err);
    // Roll back the reservation so a later retry can re-attempt.
    await supabase.from("email_log").delete().eq("dedupe_key", input.dedupeKey);
  }
}
