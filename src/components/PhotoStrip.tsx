"use client";

import Image from "next/image";

const photos = [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4].map(
  (i) => `/assets/photo-${((i - 1) % 8) + 1}.jpg`
);

export default function PhotoStrip() {
  return (
    <section className="bg-black px-0 py-[120px] overflow-hidden text-white">
      <div className="max-w-[1280px] mx-auto mb-14 px-6 md:px-12">
        <div className="font-body text-xs tracking-[0.32em] uppercase font-bold text-ch-fog mb-[18px]">
          About Cole Hocker
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 md:gap-20">
          <h2 className="font-display text-[clamp(40px,5vw,72px)] leading-[0.95] uppercase m-0 tracking-[-0.005em]">
            From Indianapolis
            <br />
            To The Top of the Sport
          </h2>
          <p className="font-body text-[17px] leading-relaxed m-0 text-ch-muted">
            Born and raised in Indianapolis, Cole&apos;s journey from a high school
            standout to an NCAA Champion at the University of Oregon, and finally
            to the pinnacle of athletics, is a testament to his dedication and
            extraordinary talent.
          </p>
        </div>
      </div>

      <div
        className="flex gap-2"
        style={{ animation: "ch-scroll 60s linear infinite" }}
      >
        {photos.map((src, i) => (
          <Image
            key={i}
            src={src}
            alt=""
            width={480}
            height={320}
            className="h-[240px] md:h-[320px] w-auto flex-none object-cover"
          />
        ))}
      </div>
    </section>
  );
}
