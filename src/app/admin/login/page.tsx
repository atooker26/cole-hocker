"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-[360px]">
        <h1 className="mb-2 font-display text-4xl uppercase tracking-[-0.01em] text-white">
          Admin
        </h1>
        <p className="mb-8 font-narrow text-xs uppercase tracking-[0.18em] text-ch-fog">
          Cole Hocker shop
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent px-4 py-3 font-body text-sm uppercase tracking-[0.1em] text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]"
          />
          <input
            type="password"
            required
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent px-4 py-3 font-body text-sm uppercase tracking-[0.1em] text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]"
          />
          {error && (
            <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
