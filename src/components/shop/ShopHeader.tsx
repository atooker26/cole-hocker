"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";

export default function ShopHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ch-border bg-black/90 px-6 py-5 backdrop-blur md:px-12">
      <Link href="/" aria-label="Home">
        <Image
          src="/assets/signature-ch.webp"
          alt="C.H."
          width={72}
          height={36}
          className="h-[36px] w-auto invert"
        />
      </Link>

      <nav className="flex items-center gap-8">
        <Link
          href="/shop"
          className="font-body text-xs tracking-[0.22em] uppercase font-bold text-white no-underline border-b border-transparent hover:border-ch-gold pb-1"
        >
          Shop
        </Link>
        <Link
          href="/cart"
          className="relative font-body text-xs tracking-[0.22em] uppercase font-bold text-white no-underline border-b border-transparent hover:border-ch-gold pb-1"
        >
          Cart
          {count > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ch-gold px-1 font-mono text-[10px] font-bold text-[#1A1306]">
              {count}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
