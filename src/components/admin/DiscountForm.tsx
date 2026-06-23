"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDiscount } from "@/lib/actions/discounts";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function DiscountForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createDiscount({
      code: code.trim(),
      type,
      value: parseFloat(value || "0"),
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
      expiresAt: expiresAt || null,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCode("");
    setValue("");
    setMaxRedemptions("");
    setExpiresAt("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px] border border-ch-border p-5">
      <div className="mb-4 font-body text-[11px] uppercase tracking-[0.2em] text-ch-gold">
        New discount code
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Code</span>
            <input
              className={inputClass}
              value={code}
              required
              placeholder="LAUNCH20"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Type</span>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "amount")}
            >
              <option value="percent">% off</option>
              <option value="amount">$ off</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              {type === "percent" ? "Percent" : "Amount $"}
            </span>
            <input
              className={inputClass}
              value={value}
              required
              inputMode="decimal"
              placeholder={type === "percent" ? "20" : "10.00"}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Max uses
            </span>
            <input
              className={inputClass}
              value={maxRedemptions}
              inputMode="numeric"
              placeholder="∞"
              onChange={(e) => setMaxRedemptions(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Expires
            </span>
            <input
              type="date"
              className={inputClass}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start bg-ch-gold px-[20px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] hover:bg-ch-gold-bright disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create code"}
        </button>
      </div>
    </form>
  );
}
