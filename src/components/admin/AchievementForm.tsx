"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/lib/actions/achievements";
import type { Achievement } from "@/lib/shop-types";

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

// Badge art that ships with the repo — offered as suggestions so a badge can be
// re-pointed without re-uploading a file that is already in /public/assets.
const BUNDLED_BADGES = [
  "/assets/olympic-champion-badge.png",
  "/assets/world-champion-badge.png",
  "/assets/world-indoor-silver-badge.png",
  "/assets/world-indoor-silver-torun-badge.png",
  "/assets/us-champion-badge.png",
  "/assets/ncaa-champion-badge.png",
];

export default function AchievementForm({
  achievement,
  nextSortOrder = 0,
}: {
  achievement?: Achievement;
  nextSortOrder?: number;
}) {
  const router = useRouter();
  const editing = !!achievement;

  const [title, setTitle] = useState(achievement?.title ?? "");
  const [subtitle, setSubtitle] = useState(achievement?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(achievement?.image_url ?? "");
  const [sortOrder, setSortOrder] = useState(
    String(achievement?.sort_order ?? nextSortOrder),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `badges/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("site-images")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setError(`Image upload failed: ${upErr.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("site-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input = {
      title,
      subtitle,
      image_url: imageUrl,
      sort_order: Number(sortOrder) || 0,
    };
    const res = editing
      ? await updateAchievement(achievement!.id, input)
      : await createAchievement(input);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/admin/achievements");
    router.refresh();
  }

  async function handleDelete() {
    if (!achievement || !confirm("Delete this achievement?")) return;
    setSaving(true);
    const res = await deleteAchievement(achievement.id);
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push("/admin/achievements");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px]">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">
        {editing ? "Edit achievement" : "New achievement"}
      </h1>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Title
          </span>
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={title}
            required
            placeholder={"Olympic\nChampion"}
            onChange={(e) => setTitle(e.target.value)}
          />
          <span className="font-narrow text-[11px] uppercase tracking-[0.1em] text-ch-muted">
            Line breaks are kept — put each word on its own line for the stacked badge look.
          </span>
        </label>

        <div className="grid grid-cols-[1fr_120px] gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
              Subtitle
            </span>
            <input
              className={inputClass}
              value={subtitle}
              placeholder="Paris 2024 · 1500 m"
              onChange={(e) => setSubtitle(e.target.value)}
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
            Badge image
          </span>
          <input
            className={inputClass}
            value={imageUrl}
            list="bundled-badges"
            placeholder="/assets/olympic-champion-badge.png"
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <datalist id="bundled-badges">
            {BUNDLED_BADGES.map((src) => (
              <option key={src} value={src} />
            ))}
          </datalist>
        </label>

        <div className="flex items-center gap-5">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              width={72}
              height={72}
              className="h-[72px] w-[72px] object-contain"
              unoptimized
            />
          )}
          <label className="cursor-pointer font-body text-[11px] uppercase tracking-[0.16em] text-ch-fog hover:text-ch-gold">
            {uploading ? "Uploading…" : "Upload new badge"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>

        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}

        <div className="mt-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
          >
            {saving ? "Saving…" : editing ? "Save achievement" : "Add achievement"}
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
