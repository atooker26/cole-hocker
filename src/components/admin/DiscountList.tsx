"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateDiscount } from "@/lib/actions/discounts";

export type DiscountRow = {
  id: string;
  code: string;
  discount: string;
  active: boolean;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: string | null;
};

function Row({ row }: { row: DiscountRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid grid-cols-[1fr_110px_90px_110px_90px] items-center gap-3 py-3">
      <div className="font-mono text-sm text-white">
        {row.code}
        {!row.active && <span className="ml-2 text-[10px] uppercase text-ch-fog">inactive</span>}
      </div>
      <div className="font-body text-xs uppercase tracking-[0.1em] text-ch-gold">
        {row.discount}
      </div>
      <div className="font-mono text-xs text-ch-muted">
        {row.timesRedeemed}
        {row.maxRedemptions != null ? `/${row.maxRedemptions}` : ""} used
      </div>
      <div className="font-mono text-xs text-ch-fog">
        {row.expiresAt ? `exp ${row.expiresAt}` : "no expiry"}
      </div>
      <div className="text-right">
        {row.active && (
          <button
            onClick={async () => {
              setBusy(true);
              await deactivateDiscount(row.id);
              setBusy(false);
              router.refresh();
            }}
            disabled={busy}
            className="font-body text-[11px] uppercase tracking-[0.14em] text-ch-fog hover:text-ch-gold disabled:opacity-50"
          >
            {busy ? "…" : "Disable"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DiscountList({ discounts }: { discounts: DiscountRow[] }) {
  if (discounts.length === 0) {
    return (
      <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
        No discount codes yet.
      </p>
    );
  }
  return (
    <div className="divide-y divide-ch-border border-y border-ch-border">
      {discounts.map((d) => (
        <Row key={d.id} row={d} />
      ))}
    </div>
  );
}
