import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConceptActions from "@/components/admin/ConceptActions";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Concept } from "@/lib/shop-types";

export const metadata = { title: "Concept — Shop Admin" };

export default async function ConceptDetailPage(
  props: PageProps<"/admin/concepts/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_concepts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const concept = data as Concept;

  return (
    <div className="max-w-[720px]">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">
            {concept.title}
          </h1>
          <div className="mt-2 font-narrow text-xs uppercase tracking-[0.12em] text-ch-fog">
            {concept.status.replace("_", " ")}
            {concept.kirk_notified_at ? " · sent to Kirk" : ""}
            {concept.created_by ? ` · by ${concept.created_by}` : ""}
          </div>
        </div>
        <Link
          href={`/admin/concepts/${concept.id}/edit`}
          className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-gold no-underline"
        >
          Edit
        </Link>
      </div>

      {concept.images.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {concept.images.map((src) => (
            <div key={src} className="relative aspect-square border border-ch-border bg-ch-asphalt">
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <dl className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Requested sizes
          </dt>
          <dd className="mt-1 font-body text-sm text-white">{concept.sizes || "—"}</dd>
        </div>
        <div>
          <dt className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Target price
          </dt>
          <dd className="mt-1 font-body text-sm text-white">
            {concept.target_price_cents != null
              ? formatPrice(concept.target_price_cents)
              : "—"}
          </dd>
        </div>
      </dl>

      {concept.notes && (
        <div className="mb-8">
          <div className="mb-2 font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Notes for Kirk
          </div>
          <p className="whitespace-pre-line font-body text-sm leading-relaxed text-ch-muted">
            {concept.notes}
          </p>
        </div>
      )}

      {concept.product_id && (
        <Link
          href={`/admin/products/${concept.product_id}`}
          className="mb-8 inline-block font-body text-[11px] uppercase tracking-[0.16em] text-ch-green no-underline"
        >
          → View the product this became
        </Link>
      )}

      <div className="border-t border-ch-border pt-6">
        <ConceptActions
          conceptId={concept.id}
          status={concept.status}
          productId={concept.product_id}
        />
      </div>
    </div>
  );
}
