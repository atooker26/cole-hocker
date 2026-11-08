/**
 * Client-side conversion events for the TEGO pixel (`tego.js`, loaded in the
 * root layout with `data-slug="cole-hocker"`).
 *
 * Convention shared across TEGO client sites:
 *  - `form_submit` fires ONLY after the server confirmed the submission, once
 *    per submission, with a stable kebab-case `formId` and a human `label`.
 *  - NEVER put PII (names, emails, phones, free text) in the event data.
 *  - Never fires on /admin.
 *  - Primary CTAs carry `data-tego-cta="<name>"`; tego.js sends those clicks
 *    itself, so no listeners here. tel:/mailto: links are auto-tracked too.
 *
 * Optional-chained on purpose: an ad blocker or a slow script load must never
 * break a form that already succeeded.
 */
declare global {
  interface Window {
    tego?: (event: string, data?: Record<string, unknown>) => void;
  }
}

export function trackFormSubmit(formId: string, label: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  try {
    window.tego?.("form_submit", { formId, label });
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * Same event, but at most once per `onceKey` in this browser tab — for a
 * confirmation page that a refresh (or Back) would otherwise re-count, like
 * /success?session_id=…. The key is stored locally only; it is never sent.
 */
export function trackFormSubmitOnce(
  formId: string,
  label: string,
  onceKey: string,
): void {
  if (typeof window === "undefined") return;
  const key = `tego:form_submit:${formId}:${onceKey}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* storage blocked — fall through and count it once for this render */
  }
  trackFormSubmit(formId, label);
}
