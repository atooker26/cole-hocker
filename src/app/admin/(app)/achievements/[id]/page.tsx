import { notFound } from "next/navigation";
import AchievementForm from "@/components/admin/AchievementForm";
import { createClient } from "@/lib/supabase/server";
import type { Achievement } from "@/lib/shop-types";

export const metadata = { title: "Edit achievement — Shop Admin" };

export default async function EditAchievementPage(
  props: PageProps<"/admin/achievements/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <AchievementForm achievement={data as Achievement} />;
}
