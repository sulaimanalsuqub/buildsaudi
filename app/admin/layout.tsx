"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "الرئيسية", icon: "◉", exact: true },
  { href: "/admin/quotes", label: "طلبات التسعير", icon: "📋" },
  { href: "/admin/vendors", label: "الموردون", icon: "🏭" },
  { href: "/admin/contracts", label: "العقود", icon: "📝" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen bg-[#F4F3EB]" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 flex h-screen w-60 flex-col border-l border-[#1D3F1F]/10 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-[#1D3F1F]/10 px-5">
          <Image
            src="/brand/logo-ar.svg"
            alt="Build"
            width={4302}
            height={1500}
            className="h-[28px] w-auto"
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive(item)
                  ? "bg-[#09B14B]/10 text-[#09B14B]"
                  : "text-[#1D3F1F]/60 hover:bg-[#1D3F1F]/5 hover:text-[#1D3F1F]",
              ].join(" ")}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-[#1D3F1F]/10 p-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#1D3F1F]/50 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <span>🚪</span>
            {loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="mr-60 flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
