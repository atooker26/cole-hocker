"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  subtitle: z.string().default(""),
  image_url: z.string().default(""),
  sort_order: z.coerce.number().int().default(0),
});

export type AchievementInput = z.input<typeof schema>;
type Result = { ok: true } | { ok: false; error: string };

function revalidate(id?: string) {
  revalidatePath("/admin/achievements");
  if (id) revalidatePath(`/admin/achievements/${id}`);
  revalidatePath("/"); // homepage badge row
}

export async function createAchievement(input: AchievementInput): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("achievements").insert({
    title: d.title,
    subtitle: d.subtitle,
    image_url: d.image_url,
    sort_order: d.sort_order,
  });
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateAchievement(
  id: string,
  input: AchievementInput,
): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("achievements")
    .update({
      title: d.title,
      subtitle: d.subtitle,
      image_url: d.image_url,
      sort_order: d.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true };
}

export async function deleteAchievement(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
