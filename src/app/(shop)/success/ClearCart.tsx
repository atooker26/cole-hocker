"use client";

import { useEffect } from "react";
import { useCart } from "@/components/shop/CartProvider";

/** Clears the local cart once, after a successful checkout. */
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
