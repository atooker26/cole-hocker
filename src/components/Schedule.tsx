const SCHEDULE = [
  { date: "JAN 23", year: "2026", name: "Hokie Invitational", loc: "Blacksburg, VA", tag: "Indoor" },
  { date: "FEB 01", year: "2026", name: "Millrose Games", loc: "New York, NY", tag: "Indoor" },
  { date: "FEB 14", year: "2026", name: "The Sound Invite", loc: "North Carolina", tag: "Indoor" },
  { date: "FEB 28", year: "2026", name: "USA Indoors", loc: "New York, NY", tag: "Championship" },
  { date: "MAR 20", year: "2026", name: "World Indoor Championships", loc: "Poland", tag: "Championship" },
];

export default function Schedule() {
  return (
    <section className="bg-black px-6 py-[120px] md:px-12 text-white">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-14">
          <div>
            <div className="font-body text-xs tracking-[0.3em] uppercase font-bold text-ch-fog mb-3">
              Race Calendar
            </div>
            <h2 className="font-display text-[clamp(48px,6vw,88px)] leading-[0.95] uppercase m-0 tracking-[-0.01em]">
              2026
              <br />
              Indoor Schedule
            </h2>
          </div>
          <div className="font-narrow text-xs tracking-[0.24em] uppercase text-ch-fog mt-4 md:mt-0">
            5 Events &middot; Jan &ndash; Mar
          </div>
        </div>

        <div>
          {SCHEDULE.map((e, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[180px_1fr_200px_auto] gap-4 md:gap-8 py-7 border-t border-ch-border items-center"
              style={{
                borderBottom: i === SCHEDULE.length - 1 ? "1px solid #1F1F22" : "none",
              }}
            >
              <div>
                <div className="font-display text-4xl leading-[0.95] uppercase">{e.date}</div>
                <div className="font-body text-[11px] tracking-[0.2em] text-ch-fog font-bold mt-1">
                  {e.year}
                </div>
              </div>
              <div className="font-body text-lg font-extrabold tracking-[0.02em] uppercase">
                {e.name}
              </div>
              <div className="font-narrow text-xs tracking-[0.2em] uppercase text-ch-muted">
                {e.loc}
              </div>
              <div className="font-body text-[10px] tracking-[0.2em] uppercase font-bold text-ch-gold px-3 py-1.5 shadow-[inset_0_0_0_1px_#C9A24B] w-fit">
                {e.tag}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
