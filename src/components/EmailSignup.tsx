"use client";

import { useState } from "react";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;

    setStatus("sending");
    try {
      const res = await fetch("https://www.tegomarketing.com/api/webhooks/cole-hocker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? "",
        },
        body: JSON.stringify({
          formType: "email-signup",
          email: email.trim(),
        }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-black px-6 py-[100px] md:px-12 text-white border-t border-ch-border">
      <div className="max-w-[640px] mx-auto text-center">
        <div className="font-body text-xs tracking-[0.32em] uppercase font-bold text-ch-gold mb-[18px]">
          Stay Connected
        </div>
        <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] uppercase m-0 tracking-[-0.005em] mb-4">
          Get Updates
        </h2>
        <p className="font-narrow text-sm tracking-[0.12em] uppercase text-ch-muted mb-10 max-w-[480px] mx-auto leading-relaxed">
          Race results, schedule updates, and behind-the-scenes content delivered to your inbox.
        </p>

        {status === "success" ? (
          <div className="font-body text-sm tracking-[0.1em] uppercase text-ch-gold font-bold">
            You&apos;re in. Stay tuned.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL"
              required
              className="flex-1 bg-transparent font-body text-[13px] tracking-[0.16em] uppercase text-white placeholder:text-ch-fog px-[22px] py-[14px] shadow-[inset_0_0_0_1px_#2A2A2D] focus:shadow-[inset_0_0_0_1px_#C9A24B] outline-none transition-all duration-[220ms]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="font-body text-[13px] tracking-[0.16em] uppercase font-extrabold bg-ch-gold text-[#1A1306] px-[22px] py-[14px] cursor-pointer transition-all duration-[220ms] hover:bg-ch-gold-bright disabled:opacity-50"
            >
              {status === "sending" ? "..." : "Sign Up →"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-4 font-narrow text-xs tracking-[0.2em] uppercase text-red-400">
            Something went wrong. Try again.
          </p>
        )}

        {/* Honeypot */}
        <input name="_hp" type="text" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
      </div>
    </section>
  );
}
