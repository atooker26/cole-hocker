"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPersonalBest,
  updatePersonalBest,
  deletePersonalBest,
} from "@/lib/actions/personal-bests";
import type { PersonalBest } from "@/lib/shop-types";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function PersonalBestForm({
  pb,
  nextSortOrder = 0,
}: {
  pb?: PersonalBest;
  nextSortOrder?: number;
}) {
  const router = useRouter();
  const editing = !!pb;

  const [event, setEvent] = useState(pb?.event ?? "");
  const [time, setTime] = useState(pb?.time ?? "");
  const [note, setNote] = useState(pb?.note ?? "");
  const [highlight, setHighlight] = useState(pb?.highlight ?? false);
  const [sortOrder, setSortOrder] = useState(String(pb?.sort_order ?? nextSortOrder));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input = { event, time, note, highlight, sort_order: Number(sortOrder) || 0 };
    const res = editing
      ? await updatePersonalBest(pb!.id, input)
      : await createPersonalBest(input);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/admin/personal-bests");
    router.refresh();
  }

  async function handleDelete() {
    if (!pb || !confirm("Delete this personal best?")) return;
    setSaving(true);
    const res = await deletePersonalBest(pb.id);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/admin/personal-bests");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px]">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">
        {editing ? "Edit personal best" : "New personal best"}
      </h1>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-[1fr_1fr_120px] gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Event
            </span>
            <input
              className={inputClass}
              value={event}
              required
              placeholder="1500 m"
              onChange={(e) => setEvent(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Time
            </span>
            <input
              className={inputClass}
              value={time}
              required
              placeholder="3:27"
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Order
            </span>
            <input
              type="number"
              className={inputClass}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Note
          </span>
          <input
            className={inputClass}
            value={note}
            placeholder="OR · AR"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={highlight}
            onChange={(e) => setHighlight(e.target.checked)}
            className="h-4 w-4 accent-[#C9A24B]"
          />
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Highlight in gold
          </span>
        </label>

        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}

        <div className="mt-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
          >
            {saving ? "Saving…" : editing ? "Save personal best" : "Add personal best"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-fog hover:text-ch-gold"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
