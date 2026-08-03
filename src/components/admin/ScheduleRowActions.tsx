"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteScheduleEntry } from "@/lib/actions/schedule";

export default function ScheduleRowActions({
  id,
  event,
}: {
  id: string;
  event: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Delete "${event}"?`)) return;
    startTransition(async () => {
      const res = await deleteScheduleEntry(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="flex items-center gap-3">
      {error && (
        <span className="font-body text-[10px] uppercase tracking-[0.08em] text-ch-gold">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label={`Delete ${event}`}
        className="px-2 py-1 font-body text-sm leading-none text-ch-fog hover:text-ch-gold disabled:opacity-40"
      >
        {pending ? "…" : "×"}
      </button>
    </span>
  );
}
