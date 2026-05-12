import Button from "./Button";

export default function Management() {
  return (
    <section
      id="management"
      className="relative text-white px-6 py-[120px] md:px-12 md:py-[160px] min-h-[520px] bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%), url(/assets/photo-5.jpg)",
      }}
    >
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12 md:gap-20 items-center">
        <div>
          <div className="font-body text-xs tracking-[0.32em] uppercase font-bold text-ch-gold mb-[18px]">
            Booking &amp; Press
          </div>
          <h2 className="font-display text-[clamp(48px,6vw,88px)] leading-[0.95] uppercase m-0 tracking-[-0.005em]">
            Management
            <br />
            &amp; Contact
          </h2>
          <p className="font-body text-lg leading-relaxed text-white mt-8 max-w-[540px]">
            For all business inquiries, media requests, or to book Cole for
            appearances and events, please contact his sports agent.
          </p>
        </div>
        <div className="bg-black/60 p-10 shadow-[inset_0_0_0_1px_#2A2A2D]">
          <div className="font-body text-[11px] tracking-[0.24em] uppercase font-bold text-ch-fog mb-3">
            Sport Agent
          </div>
          <div className="font-display text-[44px] leading-none uppercase mb-2">
            Ray Flynn
          </div>
          <div className="font-narrow text-xs tracking-[0.2em] uppercase text-ch-muted mb-8">
            Flynn Sports Management
          </div>
          <Button variant="ghost" href="https://flynnsports.com/contact/">
            Contact Agent &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
