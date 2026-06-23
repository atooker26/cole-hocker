import "server-only";

/**
 * Transactional email via TEGO's SES-backed relay (see docs/EMAIL_SETUP.md).
 * TEGO fixes the From identity to "Cole Hocker" <hello@colehocker.com> (domain
 * DKIM-verified in SES), so `from` is intentionally not a parameter. Env:
 * TEGO_API_KEY (scoped email:send, client-owned — TEGO resolves it to the Cole
 * Hocker account, no accountId).
 */
const TEGO_SEND_URL = "https://www.tegomarketing.com/api/v1/email/send";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.TEGO_API_KEY;
  if (!apiKey) throw new Error("Missing TEGO_API_KEY environment variable.");

  const res = await fetch(TEGO_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      `TEGO email failed (${res.status}): ${detail?.error?.message ?? "unknown"}`,
    );
  }

  const body = (await res.json()) as { messageId?: string };
  return body.messageId ?? "";
}
