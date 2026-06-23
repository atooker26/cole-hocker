import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/concepts", label: "Concepts" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/account", label: "Account" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 py-8 md:flex-row md:px-10">
        <aside className="md:w-[200px] md:shrink-0">
          <div className="mb-8 font-display text-2xl uppercase">Shop Admin</div>
          <nav className="flex flex-row flex-wrap gap-4 md:flex-col md:gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-body text-xs uppercase tracking-[0.16em] text-ch-muted no-underline hover:text-white md:py-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 hidden md:block">
            <div className="mb-2 font-mono text-[10px] text-ch-fog">{user.email}</div>
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
