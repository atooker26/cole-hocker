"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  sku: z.string().nullish(),
  price_cents: z.number().int().nonnegative(),
  position: z.number().int().default(0),
  quantity: z.number().int().nonnegative().default(0),
  track: z.boolean().default(true),
});

const productSchema = z.object({
  handle: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Handle must be lowercase letters, numbers, and dashes"),
  title: z.string().min(1),
  description: z.string().nullish(),
  status: z.enum(["active", "draft", "archived"]),
  images: z.array(z.string().url()).default([]),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

export type ProductInput = z.input<typeof productSchema>;
export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }
  const data = parsed.data;
  const supabase = await createClient();
  const productId = randomUUID();

  const { error: pErr } = await supabase.from("products").insert({
    id: productId,
    handle: data.handle,
    title: data.title,
    description: data.description ?? null,
    status: data.status,
    images: data.images,
  });
  if (pErr) return { ok: false, error: pErr.message };

  const variantRows = data.variants.map((v, i) => ({
    id: v.id ?? randomUUID(),
    product_id: productId,
    title: v.title,
    sku: v.sku ?? null,
    price_cents: v.price_cents,
    position: v.position ?? i,
  }));
  const { error: vErr } = await supabase.from("variants").insert(variantRows);
  if (vErr) return { ok: false, error: vErr.message };

  const inventoryRows = variantRows.map((v, i) => ({
    variant_id: v.id,
    quantity: data.variants[i].quantity,
    track: data.variants[i].track,
  }));
  const { error: iErr } = await supabase.from("inventory").insert(inventoryRows);
  if (iErr) return { ok: false, error: iErr.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, id: productId };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { error: pErr } = await supabase
    .from("products")
    .update({
      handle: data.handle,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      images: data.images,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (pErr) return { ok: false, error: pErr.message };

  // Reconcile variants: delete removed, upsert the rest.
  const { data: existing } = await supabase
    .from("variants")
    .select("id")
    .eq("product_id", id);
  const incomingIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id));
  const toDelete = (existing ?? [])
    .map((r) => r.id as string)
    .filter((eid) => !incomingIds.has(eid));
  if (toDelete.length) {
    const { error } = await supabase.from("variants").delete().in("id", toDelete);
    if (error) return { ok: false, error: error.message };
  }

  const variantRows = data.variants.map((v, i) => ({
    id: v.id ?? randomUUID(),
    product_id: id,
    title: v.title,
    sku: v.sku ?? null,
    price_cents: v.price_cents,
    position: v.position ?? i,
    updated_at: new Date().toISOString(),
  }));
  const { error: vErr } = await supabase
    .from("variants")
    .upsert(variantRows, { onConflict: "id" });
  if (vErr) return { ok: false, error: vErr.message };

  const inventoryRows = variantRows.map((v, i) => ({
    variant_id: v.id,
    quantity: data.variants[i].quantity,
    track: data.variants[i].track,
    updated_at: new Date().toISOString(),
  }));
  const { error: iErr } = await supabase
    .from("inventory")
    .upsert(inventoryRows, { onConflict: "variant_id" });
  if (iErr) return { ok: false, error: iErr.message };

  revalidatePath("/admin/products");
  revalidatePath(`/shop/${data.handle}`);
  revalidatePath("/shop");
  return { ok: true, id };
}

export async function setProductStatus(
  id: string,
  status: "active" | "draft" | "archived",
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, id };
}
