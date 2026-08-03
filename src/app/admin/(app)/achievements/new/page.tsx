import AchievementForm from "@/components/admin/AchievementForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New achievement — Shop Admin" };

export default async function NewAchievementPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("achievements")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return <AchievementForm nextSortOrder={(data?.sort_order ?? 0) + 1} />;
}
