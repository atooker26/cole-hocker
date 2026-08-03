import PersonalBestForm from "@/components/admin/PersonalBestForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New personal best — Shop Admin" };

export default async function NewPersonalBestPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("personal_bests")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return <PersonalBestForm nextSortOrder={(data?.sort_order ?? 0) + 1} />;
}
