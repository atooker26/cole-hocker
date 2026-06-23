"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/actions/products";
import type { ProductWithVariants } from "@/lib/shop-types";

type VariantRow = {
  id?: string;
  title: string;
  sku: string;
  priceDollars: string;
  quantity: string;
  track: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClass =
  "bg-transparent px-3 py-2 font-body text-sm text-white shadow-[inset_0_0_0_1px_#2A2A2D] outline-none placeholder:text-ch-fog focus:shadow-[inset_0_0_0_1px_#C9A24B]";

export default function ProductForm({
  product,
}: {
  product?: ProductWithVariants;
}) {
  const router = useRouter();
  const editing = !!product;

  const [title, setTitle] = useState(product?.title ?? "");
  const [handle, setHandle] = useState(product?.handle ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<ProductInput["status"]>(
    product?.status ?? "draft",
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku ?? "",
      priceDollars: (v.price_cents / 100).toFixed(2),
      quantity: String(v.inventory?.quantity ?? 0),
      track: v.inventory?.track ?? true,
    })) ?? [{ title: "One Size", sku: "", priceDollars: "", quantity: "0", track: true }],
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function setVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${slugify(handle || title || "product")}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });
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

    const input: ProductInput = {
      handle: handle || slugify(title),
      title,
      description: description || null,
      status,
      images,
      variants: variants.map((v, i) => ({
        id: v.id,
        title: v.title,
        sku: v.sku || null,
        price_cents: Math.round(parseFloat(v.priceDollars || "0") * 100),
        position: i,
        quantity: parseInt(v.quantity || "0", 10),
        track: v.track,
      })),
    };

    const result = editing
      ? await updateProduct(product!.id, input)
      : await createProduct(input);

    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!product || !confirm("Delete this product? This cannot be undone.")) return;
    setSaving(true);
    const result = await deleteProduct(product.id);
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[680px]">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">
        {editing ? "Edit product" : "New product"}
      </h1>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Title</span>
          <input
            className={inputClass}
            value={title}
            required
            onChange={(e) => {
              setTitle(e.target.value);
              if (!editing && !handle) setHandle(slugify(e.target.value));
            }}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Handle (URL)
          </span>
          <input
            className={inputClass}
            value={handle}
            required
            onChange={(e) => setHandle(slugify(e.target.value))}
            placeholder="cole-hocker-tee"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Description
          </span>
          <textarea
            className={`${inputClass} min-h-[120px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Status</span>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductInput["status"])}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {/* Images */}
        <div className="flex flex-col gap-2">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">Images</span>
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
          {uploading && (
            <span className="font-mono text-[11px] text-ch-fog">Uploading…</span>
          )}
        </div>

        {/* Variants */}
        <div className="flex flex-col gap-3">
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-ch-fog">
            Variants
          </span>
          <div className="grid grid-cols-[1fr_90px_70px_60px_28px] gap-2 font-mono text-[10px] uppercase text-ch-fog">
            <span>Size / title</span>
            <span>Price $</span>
            <span>Stock</span>
            <span>Track</span>
            <span />
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_70px_60px_28px] items-center gap-2">
              <input
                className={inputClass}
                value={v.title}
                required
                placeholder="M"
                onChange={(e) => setVariant(i, { title: e.target.value })}
              />
              <input
                className={inputClass}
                value={v.priceDollars}
                required
                inputMode="decimal"
                placeholder="42.00"
                onChange={(e) => setVariant(i, { priceDollars: e.target.value })}
              />
              <input
                className={inputClass}
                value={v.quantity}
                inputMode="numeric"
                onChange={(e) => setVariant(i, { quantity: e.target.value })}
              />
              <input
                type="checkbox"
                checked={v.track}
                onChange={(e) => setVariant(i, { track: e.target.checked })}
                className="h-5 w-5 accent-ch-gold"
                title="Track inventory (uncheck for made-to-order)"
              />
              <button
                type="button"
                onClick={() => setVariants((p) => p.filter((_, idx) => idx !== i))}
                className="text-ch-fog hover:text-white"
                aria-label="Remove variant"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setVariants((p) => [
                ...p,
                { title: "", sku: "", priceDollars: "", quantity: "0", track: true },
              ])
            }
            className="self-start font-body text-[11px] uppercase tracking-[0.16em] text-ch-gold"
          >
            + Add variant
          </button>
        </div>

        {error && (
          <p className="font-body text-xs uppercase tracking-[0.08em] text-ch-gold">{error}</p>
        )}

        <div className="mt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-white px-[22px] py-[14px] font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-black hover:bg-ch-gold hover:text-[#1A1306] disabled:opacity-60"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
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
