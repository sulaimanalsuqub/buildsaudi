"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, FileText, Home, LogOut, Menu, PackageCheck, Tags, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "الرئيسية", icon: Home, exact: true },
  { href: "/admin/quotes", label: "طلبات التسعير", icon: ClipboardList },
  { href: "/admin/vendors", label: "الموردون", icon: PackageCheck },
  { href: "/admin/contracts", label: "العقود", icon: FileText },
  { href: "/admin/brands", label: "العلامات التجارية", icon: Tags },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
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
      <div className="flex h-16 items-center justify-between border-b border-brand-dark/10 px-5">
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
          className="rounded-lg p-1 text-brand-dark/40 transition hover:bg-brand-dark/5 hover:text-brand-dark md:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                isActive(item)
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-brand-dark/62 hover:bg-brand-dark/5 hover:text-brand-dark",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-brand-dark/10 p-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-dark/50 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAF7]" dir="rtl">
      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between border-b border-brand-dark/10 bg-white px-4 md:hidden">
        <Image
          src="/brand/logo-ar.svg"
          alt="Build"
          width={4302}
          height={1500}
          className="h-[24px] w-auto"
        />
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-brand-dark/70 hover:bg-brand-dark/5"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
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
          "fixed right-0 top-0 z-50 flex h-screen w-64 flex-col border-l border-brand-dark/10 bg-white transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 pt-14 md:mr-64 md:pt-0">
        <div className="mx-auto w-full max-w-[1400px] p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
