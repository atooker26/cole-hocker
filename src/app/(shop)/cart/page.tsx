"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotalCents, updateQuantity, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (loading || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Checkout failed. Please try again.");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <main className="px-6 py-[60px] md:px-12">
      <div className="mx-auto max-w-[860px]">
        <h1 className="mb-10 font-display text-[clamp(36px,5vw,64px)] leading-[0.95] uppercase tracking-[-0.01em]">
          Cart
        </h1>

        {items.length === 0 ? (
          <div>
            <p className="font-narrow text-sm tracking-[0.12em] uppercase text-ch-muted">
              Your cart is empty.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block font-body text-[13px] tracking-[0.16em] uppercase font-extrabold text-white no-underline border-b border-ch-gold pb-1"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-ch-border border-y border-ch-border">
              {items.map((i) => (
                <div key={i.variantId} className="flex items-center gap-4 py-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-ch-border bg-ch-asphalt">
                    {i.image && (
                      <Image src={i.image} alt={i.productTitle} fill sizes="80px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-body text-sm font-bold uppercase tracking-[0.06em]">
                      {i.productTitle}
                    </div>
                    <div className="font-narrow text-xs uppercase tracking-[0.12em] text-ch-fog">
                      {i.variantTitle} · {formatPrice(i.priceCents, "usd")}
                    </div>
                    <button
                      onClick={() => removeItem(i.variantId)}
                      className="mt-2 font-mono text-[11px] uppercase text-ch-fog hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(i.variantId, i.quantity - 1)}
                      className="h-8 w-8 border border-ch-border text-white hover:border-white"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-sm">{i.quantity}</span>
                    <button
                      onClick={() => updateQuantity(i.variantId, i.quantity + 1)}
                      className="h-8 w-8 border border-ch-border text-white hover:border-white"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-24 text-right font-mono text-sm">
                    {formatPrice(i.priceCents * i.quantity, "usd")}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className="font-body text-xs uppercase tracking-[0.24em] text-ch-fog">
                Subtotal
              </span>
              <span className="font-display text-2xl uppercase">
                {formatPrice(subtotalCents, "usd")}
              </span>
            </div>
            <p className="mt-2 text-right font-narrow text-[11px] uppercase tracking-[0.12em] text-ch-fog">
              Shipping & tax calculated at checkout
            </p>

            {error && (
              <p className="mt-4 font-body text-xs uppercase tracking-[0.1em] text-ch-gold">
                {error}
              </p>
            )}

            <button
              onClick={checkout}
              disabled={loading}
              className="mt-6 w-full bg-ch-gold px-[22px] py-[16px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] hover:bg-ch-gold-bright disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Checkout"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
