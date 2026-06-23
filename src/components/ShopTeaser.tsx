import Link from "next/link";

export default function ShopTeaser() {
  return (
    <section className="bg-ch-stadium px-6 py-[110px] md:px-12 text-white border-t border-ch-border">
      <div className="mx-auto max-w-[760px] text-center">
        <div className="mb-[18px] font-body text-xs uppercase tracking-[0.32em] font-bold text-ch-gold">
          Official Merch
        </div>
        <h2 className="m-0 font-display text-[clamp(44px,6vw,80px)] uppercase leading-[0.92] tracking-[-0.01em]">
          Wear the Work
        </h2>
        <p className="mx-auto mt-6 max-w-[460px] font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted leading-relaxed">
          Limited apparel from Cole Hocker. New drops throughout the season.
        </p>
        <Link
          href="/shop"
          className="mt-10 inline-block bg-ch-gold px-[26px] py-[15px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] no-underline transition-colors duration-[220ms] hover:bg-ch-gold-bright"
        >
          Shop the Collection
        </Link>
      </div>
    </section>
  );
}
