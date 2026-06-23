import { notFound } from "next/navigation";
import ScheduleEntryForm from "@/components/admin/ScheduleEntryForm";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleEntry } from "@/lib/shop-types";

export const metadata = { title: "Edit race — Shop Admin" };

export default async function EditSchedulePage(
  props: PageProps<"/admin/schedule/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedule")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <ScheduleEntryForm entry={data as ScheduleEntry} />;
}
