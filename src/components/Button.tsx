"use client";

import { type ReactNode, type MouseEventHandler } from "react";

type Variant = "primary" | "ghost" | "gold" | "link";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  onClick?: MouseEventHandler;
}

const base =
  "inline-block font-body text-[13px] tracking-[0.16em] uppercase font-extrabold leading-none cursor-pointer transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline";

const variantClasses: Record<Variant, string> = {
  primary: "bg-white text-black px-[22px] py-[14px]",
  ghost: "bg-transparent text-white px-[22px] py-[14px] shadow-[inset_0_0_0_1px_#fff]",
  gold: "bg-ch-gold text-[#1A1306] px-[22px] py-[14px]",
  link: "bg-transparent text-white py-[14px] px-0 border-b border-ch-gold",
};

const hoverClasses: Record<Variant, string> = {
  primary: "hover:bg-ch-gold hover:text-[#1A1306]",
  ghost: "hover:bg-white hover:text-black",
  gold: "hover:bg-ch-gold-bright",
  link: "hover:border-white",
};

export default function Button({
  children,
  variant = "primary",
  href,
  onClick,
}: ButtonProps) {
  const className = `${base} ${variantClasses[variant]} ${hoverClasses[variant]}`;

  if (href) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}
