import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black text-white px-6 pt-20 pb-14 md:px-12 border-t border-ch-border text-center">
      <Image
        src="/assets/signature-ch.webp"
        alt="C.H."
        width={128}
        height={64}
        className="h-16 w-auto invert mx-auto mb-8"
      />
      <div className="flex justify-center gap-7 mb-10">
        <a href="https://instagram.com/colehocker" aria-label="Instagram">
          <Image src="/assets/icon-instagram.svg" alt="" width={24} height={24} />
        </a>
        <a href="https://www.youtube.com/@team_SOVA" aria-label="YouTube">
          <Image src="/assets/icon-youtube.svg" alt="" width={24} height={24} />
        </a>
        <a href="https://www.tiktok.com/@colehockerxd" aria-label="TikTok">
          <Image src="/assets/icon-tiktok.svg" alt="" width={24} height={24} />
        </a>
      </div>
      <div className="font-narrow text-[11px] tracking-[0.24em] uppercase text-ch-fog">
        &copy; 2026 Cole Hocker &middot; Nike Athlete &middot; Indianapolis, IN
      </div>
    </footer>
  );
}
