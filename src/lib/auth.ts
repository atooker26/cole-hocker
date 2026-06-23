import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for /admin/*. Returns the authenticated user or redirects to the login
 * page. We don't allow public signup — only Cole/TEGO accounts exist — so an
 * authenticated user IS an admin.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}
