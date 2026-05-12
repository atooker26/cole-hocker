const PBS = [
  { event: "800 m", time: "1:45", note: "Personal Best", gold: false },
  { event: "1500 m", time: "3:27", note: "OR \u00b7 NR \u00b7 #2 All-Time", gold: true },
  { event: "1 Mile", time: "3:45", note: "North American Record", gold: false },
  { event: "3000 m", time: "7:23", note: "#2 All-Time Indoor", gold: false },
  { event: "5000 m", time: "12:57", note: "Personal Best", gold: false },
];

export default function PersonalBests() {
  return (
    <section className="bg-black px-6 py-[120px] md:px-12 text-white border-t border-ch-border">
      <div className="max-w-[1280px] mx-auto text-center">
        <div className="font-body text-xs tracking-[0.32em] uppercase font-bold text-ch-gold mb-[18px]">
          Personal Bests
        </div>
        <h2 className="font-display text-[clamp(40px,5vw,64px)] uppercase m-0 mb-20 tracking-[-0.005em]">
          The Numbers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12">
          {PBS.map((p) => (
            <div key={p.event} className="text-center">
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
