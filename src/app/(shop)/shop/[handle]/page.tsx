import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/db/queries";
import VariantSelector, {
  type SelectableVariant,
} from "./VariantSelector";

export async function generateMetadata(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Not found — Cole Hocker" };
  return {
    title: `${product.title} — Cole Hocker`,
    description: product.description ?? `Official Cole Hocker merch: ${product.title}.`,
  };
}

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = await getProductByHandle(handle);
  if (!product || product.status !== "active") notFound();

  const variants: SelectableVariant[] = product.variants.map((v) => ({
    id: v.id,
    title: v.title,
    priceCents: v.price_cents,
    currency: v.currency,
    available: v.inventory?.track === false || (v.inventory?.quantity ?? 0) > 0,
  }));

  const image = product.images[0] ?? null;

  return (
    <main className="px-6 py-[60px] md:px-12">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden border border-ch-border bg-ch-asphalt">
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-xs text-ch-fog">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((src) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden border border-ch-border bg-ch-asphalt"
                >
                  <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="md:pt-6">
          <Link
            href="/shop"
            className="font-body text-[11px] tracking-[0.24em] uppercase font-bold text-ch-fog no-underline hover:text-white"
          >
            ← Shop
          </Link>
          <h1 className="mt-4 font-display text-[clamp(36px,5vw,64px)] leading-[0.95] uppercase tracking-[-0.01em]">
            {product.title}
          </h1>
          <div className="mt-8">
            <VariantSelector
              productHandle={product.handle}
              productTitle={product.title}
              image={image}
              variants={variants}
            />
          </div>
          {product.description && (
            <div className="mt-10 border-t border-ch-border pt-8 font-body text-sm leading-relaxed text-ch-muted whitespace-pre-line">
              {product.description}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
