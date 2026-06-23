import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Concept } from "@/lib/shop-types";

export const metadata = { title: "Concepts — Shop Admin" };

const STATUS_COLOR: Record<string, string> = {
  draft: "text-ch-fog",
  submitted: "text-ch-gold",
  in_production: "text-ch-gold-bright",
  published: "text-ch-green",
  archived: "text-ch-fog",
};

export default async function ConceptsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_concepts")
    .select("*")
    .order("created_at", { ascending: false });
  const concepts = (data ?? []) as Concept[];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">Concepts</h1>
        <Link
          href="/admin/concepts/new"
          className="bg-ch-gold px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] no-underline hover:bg-ch-gold-bright"
        >
          + New
        </Link>
      </div>
      <p className="mb-8 font-narrow text-xs uppercase tracking-[0.14em] text-ch-fog">
        Upload merch ideas → send to Kirk → convert to a product
      </p>

      {concepts.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No concepts yet. Create one to pitch Kirk a new drop.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {concepts.map((c) => (
            <Link
              key={c.id}
              href={`/admin/concepts/${c.id}`}
              className="flex items-center justify-between py-4 no-underline"
            >
              <div>
                <div className="font-body text-sm font-bold uppercase tracking-[0.06em] text-white">
                  {c.title}
                </div>
                <div className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                  {c.images.length} image{c.images.length !== 1 ? "s" : ""}
                  {c.sizes ? ` · ${c.sizes}` : ""}
                </div>
              </div>
              <span
                className={`font-body text-[10px] uppercase tracking-[0.16em] ${STATUS_COLOR[c.status] ?? "text-ch-fog"}`}
              >
                {c.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
