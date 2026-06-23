"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
} from "@/lib/actions/schedule";
import type { ScheduleEntry } from "@/lib/shop-types";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function ScheduleEntryForm({ entry }: { entry?: ScheduleEntry }) {
  const router = useRouter();
  const editing = !!entry;

  const [event, setEvent] = useState(entry?.event ?? "");
  const [location, setLocation] = useState(entry?.location ?? "");
  const [date, setDate] = useState(entry?.date ?? "");
  const [tag, setTag] = useState(entry?.tag ?? "Indoor");
  const [result, setResult] = useState(entry?.result ?? "");
  const [status, setStatus] = useState<"upcoming" | "completed">(
    entry?.status ?? "upcoming",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input = { event, location, date, tag, result: result || null, status };
    const res = editing
      ? await updateScheduleEntry(entry!.id, input)
      : await createScheduleEntry(input);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/admin/schedule");
    router.refresh();
  }

  async function handleDelete() {
    if (!entry || !confirm("Delete this race?")) return;
    setSaving(true);
    const res = await deleteScheduleEntry(entry.id);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/admin/schedule");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px]">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">
        {editing ? "Edit race" : "New race"}
      </h1>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Event</span>
          <input className={inputClass} value={event} required onChange={(e) => setEvent(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Date</span>
            <input
              type="date"
              className={inputClass}
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Location</span>
            <input
              className={inputClass}
              value={location}
              placeholder="New York, NY"
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Tag</span>
            <input
              className={inputClass}
              value={tag}
              placeholder="Indoor / Outdoor / Championship"
              onChange={(e) => setTag(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Status</span>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as "upcoming" | "completed")}
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Result (optional)
          </span>
          <input
            className={inputClass}
            value={result}
            placeholder="1st · 3:48.21"
            onChange={(e) => setResult(e.target.value)}
          />
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
            {saving ? "Saving…" : editing ? "Save race" : "Add race"}
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
