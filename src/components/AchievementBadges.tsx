import Image from "next/image";

type Badge = { title: string; sub: string; img: string };

// Shown only if the fetch itself fails (network / Supabase down). An empty table
// is respected as "no badges"; stale hardcoded art would be worse than nothing.
const FALLBACK: Badge[] = [
  { img: "/assets/olympic-champion-badge.png", title: "Olympic\nChampion", sub: "Paris 2024 · 1500 m" },
  { img: "/assets/world-champion-badge.png", title: "World\nChampion", sub: "Tokyo 2025 · 5000 m" },
  { img: "/assets/world-indoor-silver-badge.png", title: "World Indoor\nSilver", sub: "Glasgow 2024 · 1500 m" },
  { img: "/assets/world-indoor-silver-torun-badge.png", title: "World Indoor\nSilver", sub: "Toruń 2026 · 3000 m" },
  { img: "/assets/us-champion-badge.png", title: "7×\nU.S. Champion", sub: "USATF" },
  { img: "/assets/ncaa-champion-badge.png", title: "3×\nNCAA Champion", sub: "Oregon" },
];

type AchievementRow = { title: string; subtitle: string; image_url: string };

async function getAchievements(): Promise<Badge[] | null> {
  try {
    // Managed in /admin/achievements. ISR-cached; admin edits call revalidatePath("/").
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/achievements?select=title,subtitle,image_url&order=sort_order.asc`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as AchievementRow[];
    return rows.map((r) => ({ title: r.title, sub: r.subtitle, img: r.image_url }));
  } catch {
    return null;
  }
}

// Static class strings so Tailwind can see them; the row keeps one line up to
// six badges and wraps beyond that.
const COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

export default async function AchievementBadges() {
  const badges = (await getAchievements()) ?? FALLBACK;
  if (badges.length === 0) return null;

  return (
    <section className="bg-black px-6 py-24 md:px-12 text-white">
      <div
        className={`max-w-[1280px] mx-auto grid grid-cols-2 ${COLS[badges.length] ?? "md:grid-cols-6"} gap-8 items-start`}
      >
        {badges.map((b, i) => (
          <div key={i} className="text-center">
            {b.img && (
              <Image
                src={b.img}
                alt={b.title.replace("\n", " ")}
                width={140}
                height={140}
                className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] object-contain mx-auto mb-6"
              />
            )}
            <h3 className="font-display text-[22px] md:text-[26px] leading-none uppercase m-0 mb-3 whitespace-pre-line">
              {b.title}
            </h3>
            <div className="font-narrow text-[11px] tracking-[0.2em] uppercase text-ch-fog">
              {b.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
