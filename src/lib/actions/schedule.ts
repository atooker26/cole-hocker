"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  event: z.string().min(1, "Event name required"),
  location: z.string().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date required (YYYY-MM-DD)"),
  tag: z.string().default(""),
  result: z.string().nullish(),
  status: z.enum(["upcoming", "completed"]),
});

export type ScheduleInput = z.input<typeof schema>;
type Result = { ok: true } | { ok: false; error: string };

function revalidate(id?: string) {
  revalidatePath("/admin/schedule");
  if (id) revalidatePath(`/admin/schedule/${id}`);
  revalidatePath("/"); // homepage Race Calendar
}

export async function createScheduleEntry(input: ScheduleInput): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("schedule").insert({
    event: d.event,
    location: d.location ?? "",
    date: d.date,
    tag: d.tag ?? "",
    result: d.result || null,
    status: d.status,
  });
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateScheduleEntry(
  id: string,
  input: ScheduleInput,
): Promise<Result> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule")
    .update({
      event: d.event,
      location: d.location ?? "",
      date: d.date,
      tag: d.tag ?? "",
      result: d.result || null,
      status: d.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true };
}

export async function deleteScheduleEntry(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("schedule").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
