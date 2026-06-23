import Link from "next/link";
import { getAllProducts } from "@/lib/db/queries";
import { formatPrice } from "@/lib/format";
import StatusToggle from "@/components/admin/StatusToggle";

export const metadata = { title: "Products — Shop Admin" };

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ch-gold px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] no-underline hover:bg-ch-gold-bright"
        >
          + New
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No products yet. Create one or run the Shopify migration.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {products.map((p) => {
            const prices = p.variants.map((v) => v.price_cents);
            const from = prices.length ? Math.min(...prices) : 0;
            const stock = p.variants.reduce(
              (n, v) => n + (v.inventory?.quantity ?? 0),
              0,
            );
            return (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center justify-between py-4 no-underline"
              >
                <div>
                  <div className="font-body text-sm font-bold uppercase tracking-[0.06em] text-white">
                    {p.title}
                  </div>
                  <div className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                    {p.variants.length} variant{p.variants.length !== 1 ? "s" : ""} ·{" "}
                    {stock} in stock
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <StatusToggle productId={p.id} status={p.status} />
                  <span className="font-mono text-sm">{formatPrice(from)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
