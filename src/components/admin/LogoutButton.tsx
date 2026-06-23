"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="font-body text-[11px] uppercase tracking-[0.16em] text-ch-fog hover:text-white"
    >
      Sign out
    </button>
  );
}
