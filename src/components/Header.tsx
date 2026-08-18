"use client";

import { useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "#" },
  { id: "shop", label: "Shop", href: "/shop" },
  { id: "videos", label: "Videos", href: "#videos" },
  { id: "agent", label: "Sport Agent", href: "#management" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-6 md:px-12">
      <a href="#" aria-label="Cole Hocker — home">
        <Image
          src="/assets/signature-ch.webp"
          alt="Cole Hocker"
          width={224}
          height={112}
          priority
          // The signature is the brand mark, so it has to read as one. At 44px
          // against the hero photo it was a scratch you could mistake for an
          // artifact of the image — the arena lights blow out directly behind
          // it. Hence the size, and two stacked shadows: a tight dark edge for
          // contrast, a soft spread to separate it from the dark ceiling.
          // Written as one `filter` because Tailwind's `invert` and
          // `drop-shadow-*` compile to that same property and can't stack two.
          className="h-[56px] w-auto md:h-[72px] [filter:invert(1)_drop-shadow(0_1px_1px_rgba(0,0,0,0.9))_drop-shadow(0_3px_10px_rgba(0,0,0,0.7))]"
        />
      </a>

      {/* Mobile menu button */}
      <button
        className="md:hidden text-white text-2xl"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "\u2715" : "\u2630"}
      </button>

      {/* Desktop nav */}
      <nav className="hidden md:flex gap-9">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="font-body text-xs tracking-[0.22em] uppercase font-bold text-white no-underline border-b border-transparent hover:border-ch-gold pb-2 transition-[border-color] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 px-6 py-8 flex flex-col gap-6 md:hidden">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="font-body text-sm tracking-[0.22em] uppercase font-bold text-white no-underline"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
