"use client";

import { useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "#" },
  { id: "videos", label: "Videos", href: "#videos" },
  { id: "agent", label: "Sport Agent", href: "#management" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-6 md:px-12">
      <a href="#">
        <Image
          src="/assets/signature-ch.webp"
          alt="C.H."
          width={88}
          height={44}
          className="h-[44px] w-auto invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
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
