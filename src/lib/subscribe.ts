import "server-only";

/**
 * Newsletter capture into the TEGO email account behind colehocker.com — the
 * same list a campaign sends to, so a signup is immediately mailable.
 *
 * This deliberately does NOT post to TEGO's `/api/webhooks/cole-hocker`: that
 * route only appends a site-admin *submission* (never a Contact), and it needs
 * a secret in the browser bundle. The key here is server-side only.
 *
 * Env: TEGO_CONTACTS_API_KEY — scoped `contacts:write`, bound to the Cole
 * Hocker account, so no accountId travels in the request.
 */
const TEGO_CONTACTS_URL = "https://www.tegomarketing.com/api/v1/contacts";

export async function addSubscriber(
  email: string,
  tags: string[] = [],
): Promise<{ ok: boolean }> {
  const apiKey = process.env.TEGO_CONTACTS_API_KEY;
  if (!apiKey) {
    console.error("[subscribe] TEGO_CONTACTS_API_KEY is not set — signup dropped");
    return { ok: false };
  }

  try {
    const res = await fetch(TEGO_CONTACTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), tags }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[subscribe] TEGO contacts failed (${res.status}): ${detail.slice(0, 200)}`);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("[subscribe] TEGO contacts unreachable", err);
    return { ok: false };
  }
}
