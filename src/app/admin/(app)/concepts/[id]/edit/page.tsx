import { notFound } from "next/navigation";
import ConceptForm from "@/components/admin/ConceptForm";
import { createClient } from "@/lib/supabase/server";
import type { Concept } from "@/lib/shop-types";

export const metadata = { title: "Edit concept — Shop Admin" };

export default async function EditConceptPage(
  props: PageProps<"/admin/concepts/[id]/edit">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_concepts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <ConceptForm concept={data as Concept} />;
}
