"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  event: z.string().min(1, "Event required"),
  time: z.string().min(1, "Time required"),
  note: z.string().default(""),
  highlight: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
});

export type PersonalBestInput = z.input<typeof schema>;
type Result = { ok: true } | { ok: false; error: string };

function revalidate(id?: string) {
  revalidatePath("/admin/personal-bests");
  if (id) revalidatePath(`/admin/personal-bests/${id}`);
  revalidatePath("/"); // homepage "The Numbers"
}

export async function createPersonalBest(input: PersonalBestInput): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("personal_bests").insert({
    event: d.event,
    time: d.time,
    note: d.note,
    highlight: d.highlight,
    sort_order: d.sort_order,
  });
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updatePersonalBest(
  id: string,
  input: PersonalBestInput,
): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("personal_bests")
    .update({
      event: d.event,
      time: d.time,
      note: d.note,
      highlight: d.highlight,
      sort_order: d.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true };
}

export async function deletePersonalBest(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("personal_bests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
