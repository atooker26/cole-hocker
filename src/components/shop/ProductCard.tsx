import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductWithVariants } from "@/lib/shop-types";

/** Storefront product tile. Shows the lowest variant price as "from". */
export default function ProductCard({ product }: { product: ProductWithVariants }) {
  const prices = product.variants.map((v) => v.price_cents);
  const fromPrice = prices.length ? Math.min(...prices) : 0;
  const currency = product.variants[0]?.currency ?? "usd";
  const image = product.images[0] ?? null;
  const soldOut =
    product.variants.length > 0 &&
    product.variants.every(
      (v) => v.inventory?.track !== false && (v.inventory?.quantity ?? 0) <= 0,
    );

  return (
    <Link href={`/shop/${product.handle}`} className="group block no-underline">
      <div className="relative aspect-square w-full overflow-hidden bg-ch-asphalt border border-ch-border">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ch-fog font-mono text-xs">
            No image
          </div>
        )}
        {soldOut && (
          <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 font-body text-[10px] tracking-[0.2em] uppercase text-ch-muted">
            Sold Out
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="font-body text-sm tracking-[0.08em] uppercase font-bold text-white">
          {product.title}
        </div>
        <div className="mt-1 font-narrow text-xs tracking-[0.12em] uppercase text-ch-gold">
          {prices.length > 1 ? "From " : ""}
          {formatPrice(fromPrice, currency)}
        </div>
      </div>
    </Link>
  );
}
