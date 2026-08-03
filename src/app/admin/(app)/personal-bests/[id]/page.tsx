import { notFound } from "next/navigation";
import PersonalBestForm from "@/components/admin/PersonalBestForm";
import { createClient } from "@/lib/supabase/server";
import type { PersonalBest } from "@/lib/shop-types";

export const metadata = { title: "Edit personal best — Shop Admin" };

export default async function EditPersonalBestPage(
  props: PageProps<"/admin/personal-bests/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("personal_bests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <PersonalBestForm pb={data as PersonalBest} />;
}
