"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notifyKirkConcept } from "@/lib/notify";
import type { ConceptStatus } from "@/lib/shop-types";
import type { Json } from "@/lib/database.types";

const conceptSchema = z.object({
  title: z.string().min(1),
  notes: z.string().nullish(),
  sizes: z.string().nullish(),
  target_price_cents: z.number().int().nonnegative().nullable(),
  images: z.array(z.string().url()).default([]),
});

export type ConceptInput = z.input<typeof conceptSchema>;
type Result = { ok: true; id: string } | { ok: false; error: string };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createConcept(input: ConceptInput): Promise<Result> {
  const user = await requireAdmin();
  const parsed = conceptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid concept" };
  }
  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("product_concepts").insert({
    id,
    title: parsed.data.title,
    notes: parsed.data.notes ?? null,
    sizes: parsed.data.sizes ?? null,
    target_price_cents: parsed.data.target_price_cents,
    images: parsed.data.images as unknown as Json,
    created_by: user.email ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/concepts");
  return { ok: true, id };
}

export async function updateConcept(id: string, input: ConceptInput): Promise<Result> {
  await requireAdmin();
  const parsed = conceptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid concept" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_concepts")
    .update({
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      sizes: parsed.data.sizes ?? null,
      target_price_cents: parsed.data.target_price_cents,
      images: parsed.data.images as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/concepts");
  revalidatePath(`/admin/concepts/${id}`);
  return { ok: true, id };
}

export async function setConceptStatus(
  id: string,
  status: ConceptStatus,
): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_concepts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/concepts");
  revalidatePath(`/admin/concepts/${id}`);
  return { ok: true, id };
}

/** Email the full brief to Kirk and mark the concept submitted. */
export async function sendConceptToKirk(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: concept, error } = await supabase
    .from("product_concepts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !concept) return { ok: false, error: error?.message ?? "Not found" };

  await notifyKirkConcept({
    // Stable per edit: editing bumps updated_at (resend allowed); a double-click
    // without an edit reuses the key and is deduped.
    dedupeKey: `concept:${id}:${concept.updated_at}`,
    title: concept.title,
    notes: concept.notes,
    sizes: concept.sizes,
    targetPriceCents: concept.target_price_cents,
    images: (concept.images as unknown as string[]) ?? [],
    submittedBy: concept.created_by,
  });

  await supabase
    .from("product_concepts")
    .update({ status: "submitted", kirk_notified_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/concepts");
  revalidatePath(`/admin/concepts/${id}`);
  return { ok: true, id };
}

/** Spin up a draft product from a concept and link them. Returns the product id. */
export async function convertConceptToProduct(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: concept, error } = await supabase
    .from("product_concepts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !concept) return { ok: false, error: error?.message ?? "Not found" };

  const productId = randomUUID();
  const variantId = randomUUID();
  const handleBase = slugify(concept.title) || "concept";
  // Keep the handle unique-ish without a lookup; admin can edit it.
  const handle = `${handleBase}-${productId.slice(0, 6)}`;

  const { error: pErr } = await supabase.from("products").insert({
    id: productId,
    handle,
    title: concept.title,
    description: concept.notes,
    status: "draft",
    images: (concept.images as unknown as Json) ?? [],
  });
  if (pErr) return { ok: false, error: pErr.message };

  await supabase.from("variants").insert({
    id: variantId,
    product_id: productId,
    title: "Default",
    price_cents: concept.target_price_cents ?? 0,
    position: 0,
  });
  await supabase.from("inventory").insert({ variant_id: variantId, quantity: 0 });

  await supabase
    .from("product_concepts")
    .update({ status: "published", product_id: productId, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/concepts");
  revalidatePath("/admin/products");
  return { ok: true, id: productId };
}

export async function deleteConcept(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("product_concepts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/concepts");
  return { ok: true, id };
}
