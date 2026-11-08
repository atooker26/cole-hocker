"use client";

import { useEffect } from "react";
import { trackFormSubmitOnce } from "@/lib/tego-conversions";

/**
 * Counts a completed shop order for TEGO. Rendered only when the server found
 * the order row for this checkout session (written by the Stripe webhook), so
 * it never fires for a bare /success visit. Once per session id per tab.
 */
export default function TrackOrder({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    trackFormSubmitOnce("order", "Shop order", sessionId);
  }, [sessionId]);
  return null;
}
