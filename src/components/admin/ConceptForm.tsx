"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  createConcept,
  updateConcept,
  type ConceptInput,
} from "@/lib/actions/concepts";
import type { Concept } from "@/lib/shop-types";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ConceptForm({ concept }: { concept?: Concept }) {
  const router = useRouter();
  const editing = !!concept;

  const [title, setTitle] = useState(concept?.title ?? "");
  const [notes, setNotes] = useState(concept?.notes ?? "");
  const [sizes, setSizes] = useState(concept?.sizes ?? "");
  const [price, setPrice] = useState(
    concept?.target_price_cents != null
      ? (concept.target_price_cents / 100).toFixed(2)
      : "",
  );
  const [images, setImages] = useState<string[]>(concept?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `concepts/${slugify(title || "concept")}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file);
      if (upErr) {
        setError(`Image upload failed: ${upErr.message}`);
        break;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input: ConceptInput = {
      title,
      notes: notes || null,
      sizes: sizes || null,
      target_price_cents: price ? Math.round(parseFloat(price) * 100) : null,
      images,
    };
    const result = editing
      ? await updateConcept(concept!.id, input)
      : await createConcept(input);
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push(editing ? `/admin/concepts/${concept!.id}` : "/admin/concepts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[640px]">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">
        {editing ? "Edit concept" : "New concept"}
      </h1>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Title</span>
          <input className={inputClass} value={title} required onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Notes for Kirk (materials, colors, details)
          </span>
          <textarea
            className={`${inputClass} min-h-[120px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Requested sizes
            </span>
            <input
              className={inputClass}
              value={sizes}
              placeholder="S, M, L, XL"
              onChange={(e) => setSizes(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Target price $
            </span>
            <input
              className={inputClass}
              value={price}
              inputMode="decimal"
              placeholder="42.00"
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Concept images / mockups
          </span>
          <div className="flex flex-wrap gap-3">
            {images.map((src) => (
              <div key={src} className="relative h-24 w-24 border border-ch-border">
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((u) => u !== src))}
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-black text-xs text-white shadow-[0_0_0_1px_#2A2A2D]"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files)}
            className="font-mono text-xs text-ch-muted file:mr-3 file:border file:border-ch-border file:bg-transparent file:px-3 file:py-1 file:text-xs file:uppercase file:text-white"
          />
          {uploading && <span className="font-mono text-[11px] text-ch-fog">Uploading…</span>}
        </div>

        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
        >
          {saving ? "Saving…" : editing ? "Save concept" : "Create concept"}
        </button>
      </div>
    </form>
  );
}
