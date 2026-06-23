/** Client-side cart. Persisted in localStorage; server re-prices at checkout. */
export type CartItem = {
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  priceCents: number;
  image: string | null;
  quantity: number;
};

const KEY = "ch_cart_v1";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage full / disabled — ignore
  }
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.priceCents * i.quantity, 0);
}
