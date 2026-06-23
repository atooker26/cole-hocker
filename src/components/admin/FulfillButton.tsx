"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setFulfillment } from "@/lib/actions/orders";

export default function FulfillButton({
  orderId,
  fulfilled,
}: {
  orderId: string;
  fulfilled: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const res = await setFulfillment({ orderId, fulfilled: !fulfilled });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`px-[20px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] disabled:opacity-60 ${
        fulfilled
          ? "bg-transparent text-ch-muted shadow-[inset_0_0_0_1px_#2A2A2D] hover:text-white"
          : "bg-ch-gold text-[#1A1306] hover:bg-ch-gold-bright"
      }`}
    >
      {saving
        ? "…"
        : fulfilled
          ? "Mark unfulfilled"
          : "Mark fulfilled"}
    </button>
  );
}
