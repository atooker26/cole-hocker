"use client";

import { useState } from "react";
import { updateInventory } from "@/lib/actions/inventory";

export type InventoryRow = {
  variantId: string;
  product: string;
  variant: string;
  quantity: number;
  track: boolean;
};

function Row({ row }: { row: InventoryRow }) {
  const [quantity, setQuantity] = useState(String(row.quantity));
  const [track, setTrack] = useState(row.track);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    const res = await updateInventory({
      variantId: row.variantId,
      quantity: parseInt(quantity || "0", 10),
      track,
    });
    setState(res.ok ? "saved" : "error");
    if (res.ok) setTimeout(() => setState("idle"), 1500);
  }

  return (
    <div className="grid grid-cols-[1fr_80px_60px_90px] items-center gap-3 py-3">
      <div>
        <div className="font-body text-sm text-white">{row.product}</div>
        <div className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
          {row.variant}
        </div>
      </div>
      <input
        value={quantity}
        inputMode="numeric"
        disabled={!track}
        onChange={(e) => setQuantity(e.target.value)}
        className="bg-transparent px-2 py-1 font-mono text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none focus:shadow-[inset_0_0_0_1px_#C9A24B] disabled:opacity-40"
      />
      <input
        type="checkbox"
        checked={track}
        onChange={(e) => setTrack(e.target.checked)}
        className="h-5 w-5 accent-ch-gold"
        title="Track inventory"
      />
      <button
        onClick={save}
        disabled={state === "saving"}
        className="font-body text-[11px] uppercase tracking-[0.14em] text-ch-gold disabled:opacity-50"
      >
        {state === "saving"
          ? "…"
          : state === "saved"
            ? "Saved ✓"
            : state === "error"
              ? "Error"
              : "Save"}
      </button>
    </div>
  );
}

export default function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  return (
    <div className="divide-y divide-ch-border border-y border-ch-border">
      <div className="grid grid-cols-[1fr_80px_60px_90px] gap-3 py-2 font-mono text-[10px] uppercase text-ch-fog">
        <span>Product / variant</span>
        <span>Stock</span>
        <span>Track</span>
        <span />
      </div>
      {rows.map((r) => (
        <Row key={r.variantId} row={r} />
      ))}
    </div>
  );
}
