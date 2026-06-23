"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function AccountPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setState("saving");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setState("idle");
      return;
    }
    setState("done");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="max-w-[420px]">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">Account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            New password
          </span>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Confirm password
          </span>
          <input
            type="password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}
        {state === "done" && (
          <p className="font-body text-xs uppercase tracking-[0.14em] text-ch-green">
            Password updated ✓
          </p>
        )}
        <button
          type="submit"
          disabled={state === "saving"}
          className="self-start bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
        >
          {state === "saving" ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
