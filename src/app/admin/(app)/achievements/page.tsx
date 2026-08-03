import Link from "next/link";
import Image from "next/image";
import RowDeleteButton from "@/components/admin/RowDeleteButton";
import { deleteAchievement } from "@/lib/actions/achievements";
import { createClient } from "@/lib/supabase/server";
import type { Achievement } from "@/lib/shop-types";

export const metadata = { title: "Achievements — Shop Admin" };

export default async function AdminAchievementsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true });
  const badges = (data ?? []) as Achievement[];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">Achievements</h1>
        <Link
          href="/admin/achievements/new"
          className="bg-ch-gold px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] no-underline hover:bg-ch-gold-bright"
        >
          + New
        </Link>
      </div>

      {badges.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No achievements yet.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {badges.map((b) => (
            <div
              key={b.id}
              className="relative grid grid-cols-[56px_1fr_auto_auto] items-center gap-4 py-4"
            >
              {/* Stretched link: the whole row edits, the delete button sits above it. */}
              <Link
                href={`/admin/achievements/${b.id}`}
                aria-label={`Edit ${b.title.replace(/\n/g, " ")}`}
                className="absolute inset-0 no-underline"
              />
              {b.image_url ? (
                <Image
                  src={b.image_url}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  unoptimized
                />
              ) : (
                <span className="h-12 w-12" />
              )}
              <span className="font-body text-sm font-bold uppercase tracking-[0.06em] text-white">
                {b.title.replace(/\n/g, " ")}
              </span>
              <span className="font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                {b.subtitle}
              </span>
              <span className="relative">
                <RowDeleteButton
                  id={b.id}
                  label={b.title.replace(/\n/g, " ")}
                  action={deleteAchievement}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
