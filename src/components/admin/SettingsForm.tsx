"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/lib/actions/settings";
import type { Settings } from "@/lib/shop-types";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [kirkPct, setKirkPct] = useState(String(settings.kirk_pct));
  const [platformPct, setPlatformPct] = useState(String(settings.platform_pct));
  const [kirkId, setKirkId] = useState(settings.kirk_connect_account_id ?? "");
  const [coleId, setColeId] = useState(settings.cole_connect_account_id ?? "");
  const [connectEnabled, setConnectEnabled] = useState(settings.connect_enabled);
  const [notifyEmail, setNotifyEmail] = useState(settings.notify_email ?? "");
  const [shipFlat, setShipFlat] = useState(
    settings.shipping_flat_cents ? (settings.shipping_flat_cents / 100).toFixed(2) : "",
  );
  const [freeOver, setFreeOver] = useState(
    settings.free_shipping_threshold_cents
      ? (settings.free_shipping_threshold_cents / 100).toFixed(2)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const result = await updateSettings({
      kirk_pct: parseFloat(kirkPct || "0"),
      platform_pct: parseFloat(platformPct || "0"),
      kirk_connect_account_id: kirkId || null,
      cole_connect_account_id: coleId || null,
      connect_enabled: connectEnabled,
      notify_email: notifyEmail || null,
      shipping_flat_cents: shipFlat ? Math.round(parseFloat(shipFlat) * 100) : 0,
      free_shipping_threshold_cents: freeOver
        ? Math.round(parseFloat(freeOver) * 100)
        : 0,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedAt("Saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px]">
      <h1 className="mb-2 font-display text-4xl uppercase tracking-[-0.01em]">Settings</h1>
      <p className="mb-8 font-narrow text-xs uppercase tracking-[0.14em] text-ch-fog">
        Revenue split & fulfillment
      </p>

      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Kirk&apos;s cut (%)
          </span>
          <input
            className={inputClass}
            value={kirkPct}
            inputMode="decimal"
            onChange={(e) => setKirkPct(e.target.value)}
          />
          <span className="font-mono text-[11px] text-ch-fog">
            Taken from each order subtotal.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            TEGO platform fee (%)
          </span>
          <input
            className={inputClass}
            value={platformPct}
            inputMode="decimal"
            onChange={(e) => setPlatformPct(e.target.value)}
          />
          <span className="font-mono text-[11px] text-ch-fog">
            Your cut — stays in TEGO&apos;s balance. Cole receives the remainder.
          </span>
        </label>

        <div className="border border-ch-border p-4 font-mono text-[11px] text-ch-muted">
          On a $100 sale:{" "}
          <span className="text-white">
            Kirk ${(parseFloat(kirkPct || "0")).toFixed(0)} · TEGO $
            {(parseFloat(platformPct || "0")).toFixed(0)} · Cole $
            {(100 - parseFloat(kirkPct || "0") - parseFloat(platformPct || "0")).toFixed(0)}
          </span>
        </div>

        <div className="border-t border-ch-border pt-6">
          <div className="mb-4 font-body text-[11px] uppercase tracking-[0.2em] text-ch-gold">
            Shipping
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
                Flat rate ($)
              </span>
              <input
                className={inputClass}
                value={shipFlat}
                inputMode="decimal"
                placeholder="5.00"
                onChange={(e) => setShipFlat(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
                Free over ($, 0 = off)
              </span>
              <input
                className={inputClass}
                value={freeOver}
                inputMode="decimal"
                placeholder="75.00"
                onChange={(e) => setFreeOver(e.target.value)}
              />
            </label>
          </div>
          <span className="mt-2 block font-mono text-[11px] text-ch-fog">
            Charged once per order at checkout. Leave flat rate blank/0 for free
            shipping. Not part of the Kirk/Cole/TEGO split.
          </span>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Notify email (fulfillment → Kirk)
          </span>
          <input
            className={inputClass}
            value={notifyEmail}
            type="email"
            placeholder="kirk@example.com"
            onChange={(e) => setNotifyEmail(e.target.value)}
          />
        </label>

        <div className="border-t border-ch-border pt-6">
          <div className="mb-4 font-body text-[11px] uppercase tracking-[0.2em] text-ch-gold">
            Stripe Connect (optional)
          </div>
          <p className="mb-5 font-mono text-[11px] leading-relaxed text-ch-fog">
            Leave disabled to record the split without moving money. When Kirk&apos;s and
            Cole&apos;s Connect account IDs are set and this is enabled, each paid order
            automatically transfers the split.
          </p>

          <label className="mb-4 flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Kirk Connect account ID
            </span>
            <input
              className={inputClass}
              value={kirkId}
              placeholder="acct_…"
              onChange={(e) => setKirkId(e.target.value)}
            />
          </label>

          <label className="mb-4 flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Cole Connect account ID
            </span>
            <input
              className={inputClass}
              value={coleId}
              placeholder="acct_…"
              onChange={(e) => setColeId(e.target.value)}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={connectEnabled}
              onChange={(e) => setConnectEnabled(e.target.checked)}
              className="h-5 w-5 accent-ch-gold"
            />
            <span className="font-body text-xs uppercase tracking-[0.14em] text-white">
              Enable automatic transfers
            </span>
          </label>
        </div>

        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {savedAt && (
            <span className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-green">
              {savedAt}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
