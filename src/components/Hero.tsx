import Image from "next/image";

export default function Hero() {
  return (
    <section
      className="relative h-screen min-h-[720px] text-white bg-cover bg-[center_30%]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%), url(/assets/photo-3.jpg)",
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[90%]">
        <div className="font-body text-xs tracking-[0.3em] uppercase font-bold text-ch-gold mb-[18px]">
          Olympic Champion &middot; 1500 m &middot; World Record Holder
        </div>
        <h1
          className="font-display text-[clamp(96px,18vw,280px)] leading-[0.85] tracking-[-0.02em] uppercase m-0"
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
        >
          COLE
          <br />
          HOCKER
        </h1>
      </div>

      <Image
        src="/assets/hero-cole.png"
        alt=""
        width={224}
        height={56}
        className="absolute bottom-12 right-6 md:right-12 h-14 w-auto opacity-[0.92]"
      />

      <div className="absolute bottom-12 left-6 md:left-12 font-narrow text-[11px] tracking-[0.24em] uppercase text-ch-muted">
        Paris &apos;24 &middot; Tokyo &apos;25 &middot; Indianapolis-born
      </div>
    </section>
  );
}
