type PB = { event: string; time: string; note: string; gold: boolean };

// Shown only if the fetch itself fails (network / Supabase down). An empty table
// is respected as "nothing to show".
const FALLBACK: PB[] = [
  { event: "800 m", time: "1:45", note: "Personal Best", gold: false },
  { event: "1500 m", time: "3:27", note: "OR · AR", gold: true },
  { event: "1 Mile", time: "3:45", note: "Indoor American Record", gold: false },
  { event: "3000 m", time: "7:23", note: "#2 All-Time Indoor", gold: false },
  { event: "5000 m", time: "12:57", note: "Personal Best", gold: false },
];

type PersonalBestRow = {
  event: string;
  time: string;
  note: string;
  highlight: boolean;
};

async function getPersonalBests(): Promise<PB[] | null> {
  try {
    // Managed in /admin/personal-bests. ISR-cached; admin edits call revalidatePath("/").
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/personal_bests?select=event,time,note,highlight&order=sort_order.asc`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
        next: { revalidate: 60 },
        // A hung request must not stall the prerender: Next kills a page that
        // takes over 60s, which fails the whole build.
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as PersonalBestRow[];
    return rows.map((r) => ({
      event: r.event,
      time: r.time,
      note: r.note,
      gold: r.highlight,
    }));
  } catch {
    return null;
  }
}

// Static class strings so Tailwind can see them.
const COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

export default async function PersonalBests() {
  const pbs = (await getPersonalBests()) ?? FALLBACK;
  if (pbs.length === 0) return null;

  return (
    <section className="bg-black px-6 py-[120px] md:px-12 text-white border-t border-ch-border">
      <div className="max-w-[1280px] mx-auto text-center">
        <div className="font-body text-xs tracking-[0.32em] uppercase font-bold text-ch-gold mb-[18px]">
          Personal Bests
        </div>
        <h2 className="font-display text-[clamp(40px,5vw,64px)] uppercase m-0 mb-20 tracking-[-0.005em]">
          The Numbers
        </h2>
        <div
          className={`grid grid-cols-2 ${COLS[pbs.length] ?? "md:grid-cols-5"} gap-10 md:gap-12`}
        >
          {pbs.map((p, i) => (
            <div key={i} className="text-center">
              <div className="font-body text-[11px] tracking-[0.24em] uppercase font-bold text-ch-fog mb-4">
                {p.event}
              </div>
              <div
                className={`font-display text-[clamp(64px,8vw,128px)] leading-[0.85] tracking-[-0.02em] ${
                  p.gold ? "text-ch-gold" : "text-white"
                }`}
              >
                {p.time}
              </div>
              <div className="font-narrow text-[11px] tracking-[0.2em] uppercase text-ch-muted mt-4 leading-normal">
                {p.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
