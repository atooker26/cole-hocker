/**
 * Configurable revenue split for a sale.
 *
 * The Stripe Connect topology is not finalized, so this stays pure and
 * config-driven: the webhook reads `kirk_pct` (and optionally a platform fee)
 * from the `settings` row, computes the split, and snapshots the amounts onto
 * the order. When real Connect accounts exist, the same numbers drive Stripe
 * Transfers — no recomputation needed.
 *
 * All values are integer cents. Kirk's cut is taken first; the remainder is
 * Cole's profit. An optional platform percentage (TEGO's fee) can be carved out
 * as well. Rounding favors Cole receiving the residual so the parts always sum
 * to the subtotal exactly.
 */
export type Split = {
  kirkCents: number;
  coleCents: number;
  platformCents: number;
};

export function computeSplit(
  subtotalCents: number,
  kirkPct: number,
  platformPct = 0,
): Split {
  const kirkCents = Math.round((subtotalCents * kirkPct) / 100);
  const platformCents = Math.round((subtotalCents * platformPct) / 100);
  const coleCents = subtotalCents - kirkCents - platformCents;
  return { kirkCents, coleCents, platformCents };
}
