import { redirect } from "next/navigation";
import { createServiceRoleClient, createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { ClipboardList, FileText, PackageCheck, Tags, Timer } from "lucide-react";

export default async function AdminHomePage() {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Verify user is an admin — if not, redirect to homepage (avoids login loop)
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    redirect("/");
  }

  const serviceSupabase = createServiceRoleClient();

  const [{ count: quotesCount }, { count: vendorsCount }, { count: newQuotesCount }, { count: pendingVendorsCount }] =
    await Promise.all([
      serviceSupabase.from("quotes").select("*", { count: "exact", head: true }),
      serviceSupabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "active"),
      serviceSupabase.from("quotes").select("*", { count: "exact", head: true }).eq("status", "new"),
      serviceSupabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const stats = [
    { label: "إجمالي الطلبات", value: quotesCount ?? 0, icon: ClipboardList, color: "bg-blue-50 text-blue-700" },
    { label: "طلبات جديدة", value: newQuotesCount ?? 0, icon: Timer, color: "bg-amber-50 text-amber-700" },
    { label: "موردون نشطون", value: vendorsCount ?? 0, icon: PackageCheck, color: "bg-emerald-50 text-emerald-700" },
    { label: "موردون بانتظار المراجعة", value: pendingVendorsCount ?? 0, icon: Timer, color: "bg-orange-50 text-orange-700" },
  ];

  const quickLinks = [
    {
      href: "/admin/quotes",
      icon: ClipboardList,
      title: "إدارة طلبات التسعير",
      body: "مراجعة الطلبات وإرسال RFQ للموردين",
    },
    {
      href: "/admin/vendors",
      icon: PackageCheck,
      title: "إدارة الموردين",
      body: "تفعيل الموردين ومراجعة بيانات التأهيل",
    },
    {
      href: "/admin/contracts",
      icon: FileText,
      title: "العقود",
      body: "إدارة عقد الموردين وتتبع التوقيعات",
    },
    {
      href: "/admin/brands",
      icon: Tags,
      title: "العلامات التجارية",
      body: "إدارة العلامات التجارية المتاحة",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-primary">نظرة عامة</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-dark">لوحة الإدارة</h1>
        <p className="mt-1 text-sm text-brand-dark/55">متابعة الطلبات والموردين والعقود من مكان واحد.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
          <div
            key={stat.label}
            className="rounded-xl border border-brand-dark/10 bg-white p-5 shadow-[0_12px_34px_rgba(29,63,31,0.05)]"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-3xl font-bold text-brand-dark">{stat.value}</p>
            <p className="mt-1 text-sm text-brand-dark/55">{stat.label}</p>
          </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-xl border border-brand-dark/10 bg-white p-5 transition-all hover:border-brand-primary/30 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-brand-dark">{item.title}</p>
                <p className="text-sm text-brand-dark/55">{item.body}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
