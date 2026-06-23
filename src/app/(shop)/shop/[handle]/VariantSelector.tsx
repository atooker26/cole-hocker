"use client";

import { useState } from "react";
import AddToCartButton from "@/components/shop/AddToCartButton";
import { formatPrice } from "@/lib/format";

export type SelectableVariant = {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
  available: boolean;
};

export default function VariantSelector({
  productHandle,
  productTitle,
  image,
  variants,
}: {
  productHandle: string;
  productTitle: string;
  image: string | null;
  variants: SelectableVariant[];
}) {
  const firstAvailable = variants.find((v) => v.available) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? firstAvailable;

  if (!selected) {
    return (
      <p className="font-narrow text-sm tracking-[0.12em] uppercase text-ch-muted">
        Unavailable.
      </p>
    );
  }

  return (
    <div>
      <div className="font-display text-[clamp(28px,3vw,40px)] uppercase text-ch-gold mb-8">
        {formatPrice(selected.priceCents, selected.currency)}
      </div>

      {variants.length > 1 && (
        <div className="mb-8">
          <div className="font-body text-[11px] tracking-[0.24em] uppercase font-bold text-ch-fog mb-3">
            Size
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.id === selected.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  disabled={!v.available}
                  className={`min-w-[52px] px-4 py-3 font-body text-xs tracking-[0.12em] uppercase font-bold transition-all ${
                    active
                      ? "bg-white text-black"
                      : "bg-transparent text-white shadow-[inset_0_0_0_1px_#2A2A2D] hover:shadow-[inset_0_0_0_1px_#fff]"
                  } ${!v.available ? "cursor-not-allowed text-ch-fog line-through" : ""}`}
                >
                  {v.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AddToCartButton
        disabled={!selected.available}
        item={{
          variantId: selected.id,
          productHandle,
          productTitle,
          variantTitle: selected.title,
          priceCents: selected.priceCents,
          image,
        }}
      />
    </div>
  );
}
