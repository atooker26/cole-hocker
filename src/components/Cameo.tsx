import Image from "next/image";
import Button from "./Button";

export default function Cameo() {
  return (
    <section className="bg-ch-bone text-[#0B0B0C] px-6 py-[120px] md:px-12">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <Image
          src="/assets/cameo-banner.png"
          alt="Cole on Cameo"
          width={550}
          height={550}
          className="w-full h-auto"
        />
        <div>
          <div className="font-body text-xs tracking-[0.32em] uppercase font-bold text-ch-fog mb-[18px]">
            On Cameo
          </div>
          <h2 className="font-display text-[clamp(40px,5vw,72px)] leading-[0.95] uppercase m-0 tracking-[-0.005em] text-black">
            A Personal
            <br />
            Message from Cole
          </h2>
          <p className="font-body text-[17px] leading-relaxed mt-7 max-w-[460px] text-ch-graphite">
            Whether it&apos;s a birthday greeting, a motivational message, or a
            shout-out &mdash; Cole is available on Cameo.
          </p>
          <div className="mt-8">
            <Button variant="primary" href="https://www.cameo.com/cole_hocker">
              Get Yours Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
