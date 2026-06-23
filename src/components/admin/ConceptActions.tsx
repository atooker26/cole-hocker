"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendConceptToKirk,
  setConceptStatus,
  convertConceptToProduct,
  deleteConcept,
} from "@/lib/actions/concepts";
import type { ConceptStatus } from "@/lib/shop-types";

const STATUSES: ConceptStatus[] = [
  "draft",
  "submitted",
  "in_production",
  "published",
  "archived",
];

export default function ConceptActions({
  conceptId,
  status,
  productId,
}: {
  conceptId: string;
  status: ConceptStatus;
  productId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setMsg(null);
    await fn();
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            run("send", async () => {
              const r = await sendConceptToKirk(conceptId);
              setMsg(r.ok ? "Brief emailed to Kirk ✓" : `Error: ${r.ok === false ? r.error : ""}`);
            })
          }
          disabled={busy !== null}
          className="bg-ch-gold px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#1A1306] hover:bg-ch-gold-bright disabled:opacity-60"
        >
          {busy === "send" ? "Sending…" : "Send to Kirk"}
        </button>

        {!productId && (
          <button
            onClick={() =>
              run("convert", async () => {
                const r = await convertConceptToProduct(conceptId);
                if (r.ok) router.push(`/admin/products/${r.id}`);
                else setMsg(`Error: ${r.error}`);
              })
            }
            disabled={busy !== null}
            className="bg-white px-[18px] py-[12px] font-body text-[12px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
          >
            {busy === "convert" ? "Creating…" : "Convert to product"}
          </button>
        )}

        <label className="ml-auto flex items-center gap-2 font-body text-[11px] uppercase tracking-[0.16em] text-ch-fog">
          Status
          <select
            value={status}
            disabled={busy !== null}
            onChange={(e) =>
              run("status", () =>
                setConceptStatus(conceptId, e.target.value as ConceptStatus),
              )
            }
            className="bg-transparent px-2 py-1 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (confirm("Delete this concept?")) {
              run("delete", async () => {
                const r = await deleteConcept(conceptId);
                if (r.ok) router.push("/admin/concepts");
              });
            }
          }}
          disabled={busy !== null}
          className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-fog hover:text-ch-gold"
        >
          Delete
        </button>
        {msg && (
          <span className="font-body text-[11px] uppercase tracking-[0.14em] text-ch-green">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
