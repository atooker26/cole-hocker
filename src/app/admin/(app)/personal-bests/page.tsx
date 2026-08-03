import Link from "next/link";
import RowDeleteButton from "@/components/admin/RowDeleteButton";
import { deletePersonalBest } from "@/lib/actions/personal-bests";
import { createClient } from "@/lib/supabase/server";
import type { PersonalBest } from "@/lib/shop-types";

export const metadata = { title: "Personal bests — Shop Admin" };

export default async function AdminPersonalBestsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("personal_bests")
    .select("*")
    .order("sort_order", { ascending: true });
  const pbs = (data ?? []) as PersonalBest[];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">Personal Bests</h1>
        <Link
          href="/admin/personal-bests/new"
          className="bg-ch-gold px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] no-underline hover:bg-ch-gold-bright"
        >
          + New
        </Link>
      </div>

      {pbs.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No personal bests yet.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {pbs.map((p) => (
            <div
              key={p.id}
              className="relative grid grid-cols-[110px_100px_1fr_auto] items-center gap-4 py-4"
            >
              {/* Stretched link: the whole row edits, the delete button sits above it. */}
              <Link
                href={`/admin/personal-bests/${p.id}`}
                aria-label={`Edit ${p.event}`}
                className="absolute inset-0 no-underline"
              />
              <span className="font-body text-sm font-bold uppercase tracking-[0.06em] text-white">
                {p.event}
              </span>
              <span
                className={`font-mono text-sm ${p.highlight ? "text-ch-gold" : "text-white"}`}
              >
                {p.time}
              </span>
              <span className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                {p.note}
              </span>
              <span className="relative">
                <RowDeleteButton id={p.id} label={p.event} action={deletePersonalBest} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
