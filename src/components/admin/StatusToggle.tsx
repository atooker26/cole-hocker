"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setProductStatus } from "@/lib/actions/products";
import type { ProductStatus } from "@/lib/shop-types";

/** Quick active↔draft toggle on the products list. Archived shown read-only. */
export default function StatusToggle({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  if (status === "archived") {
    return (
      <span className="font-body text-[10px] uppercase tracking-[0.16em] text-ch-fog">
        archived
      </span>
    );
  }

  const next: ProductStatus = status === "active" ? "draft" : "active";

  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        setSaving(true);
        await setProductStatus(productId, next);
        setSaving(false);
        router.refresh();
      }}
      disabled={saving}
      title={`Click to set ${next}`}
      className={`font-body text-[10px] uppercase tracking-[0.16em] disabled:opacity-50 ${
        status === "active" ? "text-ch-green" : "text-ch-fog"
      }`}
    >
      {saving ? "…" : status}
    </button>
  );
}
