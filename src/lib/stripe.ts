import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazily-instantiated server-side Stripe SDK. Lazy so a missing key surfaces at
 * request time (not at build/import time). apiVersion is pinned by the SDK.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}
