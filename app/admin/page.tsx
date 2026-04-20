import { createServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminHomePage() {
  const supabase = createServiceRoleClient();

  const [{ count: quotesCount }, { count: vendorsCount }, { count: newQuotesCount }, { count: pendingVendorsCount }] =
    await Promise.all([
      supabase.from("quotes").select("*", { count: "exact", head: true }),
      supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("quotes").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const stats = [
    { label: "إجمالي الطلبات", value: quotesCount ?? 0, icon: "📋", color: "bg-blue-50 text-blue-700" },
    { label: "طلبات جديدة", value: newQuotesCount ?? 0, icon: "🆕", color: "bg-amber-50 text-amber-700" },
    { label: "موردون نشطون", value: vendorsCount ?? 0, icon: "🏭", color: "bg-green-50 text-green-700" },
    { label: "موردون بانتظار المراجعة", value: pendingVendorsCount ?? 0, icon: "⏳", color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">لوحة الإدارة</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">مرحباً، هذه نظرة عامة على النظام</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5"
          >
            <div className={`w-fit rounded-xl px-2.5 py-1.5 text-lg ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="mt-3 text-3xl font-bold text-[#1D3F1F]">{stat.value}</p>
            <p className="mt-1 text-sm text-[#1D3F1F]/55">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/quotes"
          className="flex items-center gap-4 rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 transition-all hover:border-[#09B14B]/30"
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold text-[#1D3F1F]">إدارة طلبات التسعير</p>
            <p className="text-sm text-[#1D3F1F]/55">راجع الطلبات وأرسل RFQ للموردين</p>
          </div>
        </Link>
        <Link
          href="/admin/vendors"
          className="flex items-center gap-4 rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 transition-all hover:border-[#09B14B]/30"
        >
          <span className="text-2xl">🏭</span>
          <div>
            <p className="font-semibold text-[#1D3F1F]">إدارة الموردين</p>
            <p className="text-sm text-[#1D3F1F]/55">فعّل أو أوقف الموردين المسجلين</p>
          </div>
        </Link>
        <Link
          href="/admin/contracts"
          className="flex items-center gap-4 rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 transition-all hover:border-[#09B14B]/30"
        >
          <span className="text-2xl">📝</span>
          <div>
            <p className="font-semibold text-[#1D3F1F]">العقود</p>
            <p className="text-sm text-[#1D3F1F]/55">إدارة عقود الموردين وطلبات التوقيع</p>
          </div>
        </Link>
        <Link
          href="/admin/brands"
          className="flex items-center gap-4 rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 transition-all hover:border-[#09B14B]/30"
        >
          <span className="text-2xl">🏷️</span>
          <div>
            <p className="font-semibold text-[#1D3F1F]">العلامات التجارية</p>
            <p className="text-sm text-[#1D3F1F]/55">إدارة العلامات التجارية المتاحة</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

