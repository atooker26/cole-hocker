"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  cartCount,
  cartSubtotal,
  loadCart,
  saveCart,
  type CartItem,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount (localStorage is client-only).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setItems(loadCart());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist on change (after hydration so we don't clobber stored cart with []).
  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      count: cartCount(items),
      subtotalCents: cartSubtotal(items),
      addItem(item, quantity = 1) {
        setItems((prev) => {
          const existing = prev.find((i) => i.variantId === item.variantId);
          if (existing) {
            return prev.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            );
          }
          return [...prev, { ...item, quantity }];
        });
      },
      updateQuantity(variantId, quantity) {
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.variantId !== variantId)
            : prev.map((i) =>
                i.variantId === variantId ? { ...i, quantity } : i,
              ),
        );
      },
      removeItem(variantId) {
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
