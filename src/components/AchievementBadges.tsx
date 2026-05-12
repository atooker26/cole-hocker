import Image from "next/image";

const BADGES = [
  { img: "/assets/olympic-champion-badge.png", title: "Olympic\nChampion", sub: "Paris 2024 \u00b7 1500 m" },
  { img: "/assets/world-champion-badge.png", title: "World\nChampion", sub: "Tokyo 2025 \u00b7 5000 m" },
  { img: "/assets/world-indoor-silver-badge.png", title: "World Indoor\nSilver", sub: "Glasgow 2024 \u00b7 1500 m" },
  { img: "/assets/us-champion-badge.png", title: "5\u00d7\nU.S. Champion", sub: "USATF" },
  { img: "/assets/ncaa-champion-badge.png", title: "3\u00d7\nNCAA Champion", sub: "Oregon" },
];

export default function AchievementBadges() {
  return (
    <section className="bg-black px-6 py-24 md:px-12 text-white">
      <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 items-start">
        {BADGES.map((b, i) => (
          <div key={i} className="text-center">
            <Image
              src={b.img}
              alt={b.title.replace("\n", " ")}
              width={140}
              height={140}
              className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] object-contain mx-auto mb-6"
            />
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
