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
  { href: "/admin/brands", label: "العلامات التجارية", icon: "🏷️" },
  { href: "/admin/users", label: "المستخدمون", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[#1D3F1F]/10 px-5">
        <Image
          src="/brand/logo-ar.svg"
          alt="Build"
          width={4302}
          height={1500}
          className="h-[28px] w-auto"
        />
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden rounded-lg p-1 text-[#1D3F1F]/40 hover:bg-[#1D3F1F]/5 hover:text-[#1D3F1F]"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F3EB]" dir="rtl">
      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between border-b border-[#1D3F1F]/10 bg-white px-4 md:hidden">
        <Image
          src="/brand/logo-ar.svg"
          alt="Build"
          width={4302}
          height={1500}
          className="h-[24px] w-auto"
        />
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-[#1D3F1F]/70 hover:bg-[#1D3F1F]/5"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: fixed, Mobile: overlay */}
      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-screen w-60 flex-col border-l border-[#1D3F1F]/10 bg-white transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 pt-14 md:pt-0 md:mr-60 p-4 md:p-8">{children}</main>
    </div>
  );
}
