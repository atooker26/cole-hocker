import ProductCard from "@/components/shop/ProductCard";
import { getActiveProducts } from "@/lib/db/queries";

export const metadata = {
  title: "Shop — Cole Hocker",
  description: "Official Cole Hocker merch.",
};

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <main className="px-6 py-[80px] md:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12">
          <div className="font-body text-xs tracking-[0.3em] uppercase font-bold text-ch-fog mb-3">
            Official Store
          </div>
          <h1 className="font-display text-[clamp(48px,6vw,88px)] leading-[0.95] uppercase m-0 tracking-[-0.01em]">
            Shop
          </h1>
        </div>

        {products.length === 0 ? (
          <p className="font-narrow text-sm tracking-[0.12em] uppercase text-ch-muted">
            New drops coming soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
