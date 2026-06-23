"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setFulfillment } from "@/lib/actions/orders";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function FulfillButton({
  orderId,
  fulfilled,
}: {
  orderId: string;
  fulfilled: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  async function submit(nextFulfilled: boolean) {
    setSaving(true);
    const res = await setFulfillment({
      orderId,
      fulfilled: nextFulfilled,
      tracking_number: tracking,
      tracking_carrier: carrier,
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  if (fulfilled) {
    return (
      <button
        onClick={() => submit(false)}
        disabled={saving}
        className="px-[20px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] bg-transparent text-ch-muted shadow-[inset_0_0_0_1px_#2A2A2D] hover:text-white disabled:opacity-60"
      >
        {saving ? "…" : "Mark unfulfilled"}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <input
          className={`${inputClass} w-[90px]`}
          placeholder="CARRIER"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
        />
        <input
          className={`${inputClass} w-[150px]`}
          placeholder="TRACKING #"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
        />
      </div>
      <button
        onClick={() => submit(true)}
        disabled={saving}
        className="px-[20px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] bg-ch-gold text-[#1A1306] hover:bg-ch-gold-bright disabled:opacity-60"
      >
        {saving ? "…" : "Mark fulfilled"}
      </button>
      <span className="font-mono text-[10px] text-ch-fog">
        Tracking optional — emails the customer if set
      </span>
    </div>
  );
}
