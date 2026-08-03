"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Row-level delete for the admin list pages. The server action is passed in as
 * a prop so achievements and personal bests share one button.
 */
export default function RowDeleteButton({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action: (id: string) => Promise<DeleteResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Delete "${label}"?`)) return;
    startTransition(async () => {
      const res = await action(id);
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
        aria-label={`Delete ${label}`}
        className="px-2 py-1 font-body text-sm leading-none text-ch-fog hover:text-ch-gold disabled:opacity-40"
      >
        {pending ? "…" : "×"}
      </button>
    </span>
  );
}
