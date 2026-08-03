import Link from "next/link";
import ScheduleRowActions from "@/components/admin/ScheduleRowActions";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleEntry } from "@/lib/shop-types";

export const metadata = { title: "Schedule — Shop Admin" };

function fmt(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminSchedulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedule")
    .select("*")
    .order("date", { ascending: true });
  const entries = (data ?? []) as ScheduleEntry[];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-[-0.01em]">Schedule</h1>
        <Link
          href="/admin/schedule/new"
          className="bg-ch-gold px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] no-underline hover:bg-ch-gold-bright"
        >
          + New
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No races yet.
        </p>
      ) : (
        <div className="divide-y divide-ch-border border-y border-ch-border">
          {entries.map((e) => (
            <div
              key={e.id}
              className="relative grid grid-cols-[110px_1fr_auto_auto] items-center gap-4 py-4"
            >
              {/* Stretched link: covers the row so the whole thing stays
                  clickable, while the delete button sits above it. */}
              <Link
                href={`/admin/schedule/${e.id}`}
                aria-label={`Edit ${e.event}`}
                className="absolute inset-0 no-underline"
              />
              <span className="font-mono text-sm text-white">{fmt(e.date)}</span>
              <span>
                <span className="font-body text-sm font-bold uppercase tracking-[0.06em] text-white">
                  {e.event}
                </span>
                <span className="ml-2 font-narrow text-xs uppercase tracking-[0.1em] text-ch-fog">
                  {e.location}
                </span>
              </span>
              <span className="flex items-center gap-4">
                {e.result && (
                  <span className="font-mono text-xs text-ch-gold">{e.result}</span>
                )}
                <span
                  className={`font-body text-[10px] uppercase tracking-[0.16em] ${
                    e.status === "completed" ? "text-ch-fog" : "text-ch-green"
                  }`}
                >
                  {e.tag}
                </span>
              </span>
              <span className="relative">
                <ScheduleRowActions id={e.id} event={e.event} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
