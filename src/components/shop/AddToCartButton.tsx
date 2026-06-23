"use client";

import { useState } from "react";
import { useCart } from "@/components/shop/CartProvider";
import type { CartItem } from "@/lib/cart";

const base =
  "inline-block font-body text-[13px] tracking-[0.16em] uppercase font-extrabold leading-none cursor-pointer transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline px-[22px] py-[14px]";

export default function AddToCartButton({
  item,
  disabled,
}: {
  item: Omit<CartItem, "quantity">;
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (disabled) {
    return (
      <span
        className={`${base} bg-ch-graphite text-ch-fog cursor-not-allowed`}
        aria-disabled
      >
        Sold Out
      </span>
    );
  }

  return (
    <button
      className={`${base} bg-ch-gold text-[#1A1306] hover:bg-ch-gold-bright`}
      onClick={() => {
        addItem(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
