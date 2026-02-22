"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserCircle2
} from "lucide-react";

type DashboardViewProps = {
  isRtl?: boolean;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const stats = {
  ar: [
    { label: "طلبات نشطة", value: "128", delta: "+12%" },
    { label: "موردون معتمدون", value: "340", delta: "+8%" },
    { label: "شحنات اليوم", value: "54", delta: "+5%" },
    { label: "متوسط زمن التوريد", value: "19 ساعة", delta: "-9%" }
  ],
  en: [
    { label: "Active Requests", value: "128", delta: "+12%" },
    { label: "Verified Suppliers", value: "340", delta: "+8%" },
    { label: "Shipments Today", value: "54", delta: "+5%" },
    { label: "Avg Supply Time", value: "19h", delta: "-9%" }
  ]
};

const recentOrders = {
  ar: [
    { id: "ORD-24091", project: "مشروع حي الياسمين", category: "كهرباء وإنارة", status: "قيد التوريد", amount: "92,000 ر.س" },
    { id: "ORD-24087", project: "برج الأعمال - جدة", category: "سباكة", status: "بانتظار العرض", amount: "61,500 ر.س" },
    { id: "ORD-24082", project: "مستودعات الشرقية", category: "عوازل", status: "مكتمل", amount: "134,200 ر.س" },
    { id: "ORD-24076", project: "مجمع سكني - مكة", category: "دهانات وديكور", status: "قيد التوريد", amount: "48,900 ر.س" }
  ],
  en: [
    { id: "ORD-24091", project: "Yasmin District Project", category: "Electrical & Lighting", status: "In Supply", amount: "SAR 92,000" },
    { id: "ORD-24087", project: "Jeddah Business Tower", category: "Plumbing", status: "Awaiting Quotation", amount: "SAR 61,500" },
    { id: "ORD-24082", project: "Eastern Warehouses", category: "Insulation", status: "Completed", amount: "SAR 134,200" },
    { id: "ORD-24076", project: "Makkah Residential Complex", category: "Paint & Decor", status: "In Supply", amount: "SAR 48,900" }
  ]
};

const statusTone = (status: string) => {
  if (status.includes("مكتمل") || status.includes("Completed")) return "bg-brand-primary/12 text-brand-dark border-brand-primary/25";
  if (status.includes("بانتظار") || status.includes("Awaiting")) return "bg-brand-accent/18 text-brand-dark border-brand-accent/30";
  return "bg-brand-dark/8 text-brand-dark border-brand-dark/20";
};

export function DashboardView({ isRtl = false }: DashboardViewProps) {
  const sidebarBorderClass = isRtl ? "border-l" : "border-r";
  const navItems: NavItem[] = isRtl
    ? [
        { id: "overview", label: "لوحة التحكم", icon: LayoutDashboard },
        { id: "requests", label: "الطلبات", icon: ClipboardList },
        { id: "suppliers", label: "الموردون", icon: Building2 },
        { id: "shipments", label: "الشحنات", icon: Truck },
        { id: "products", label: "المنتجات", icon: Package },
        { id: "settings", label: "الإعدادات", icon: Settings }
      ]
    : [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "requests", label: "Requests", icon: ClipboardList },
        { id: "suppliers", label: "Suppliers", icon: Building2 },
        { id: "shipments", label: "Shipments", icon: Truck },
        { id: "products", label: "Products", icon: Package },
        { id: "settings", label: "Settings", icon: Settings }
      ];

  const copy = {
    title: isRtl ? "لوحة التحكم" : "Dashboard",
    sub: isRtl ? "متابعة الطلبات والتوريد للمشاريع في الوقت الفعلي" : "Track project requests and supply operations in real time",
    search: isRtl ? "ابحث برقم الطلب أو اسم المشروع..." : "Search by order ID or project name...",
    live: isRtl ? "تشغيل مباشر" : "Live System",
    tableTitle: isRtl ? "أحدث الطلبات" : "Recent Orders",
    activityTitle: isRtl ? "نشاط اليوم" : "Today's Activity",
    activity: isRtl
      ? ["تم اعتماد 14 موردًا جديدًا", "تم تسليم 22 شحنة للمشاريع", "9 طلبات جديدة بانتظار التسعير"]
      : ["14 new suppliers were verified", "22 shipments were delivered", "9 new requests are awaiting quotations"],
    viewSite: isRtl ? "عرض الموقع" : "View Website",
    signOut: isRtl ? "تسجيل الخروج" : "Sign Out"
  };

  const s = isRtl ? stats.ar : stats.en;
  const orders = isRtl ? recentOrders.ar : recentOrders.en;

  return (
    <div className="min-h-screen bg-brand-light" dir={isRtl ? "rtl" : "ltr"}>
      <aside className={`fixed top-0 z-40 h-screen w-[280px] ${sidebarBorderClass} border-white/10 bg-brand-dark p-6 text-white`}>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Build</h1>
          <ShieldCheck className="h-5 w-5 text-brand-accent" />
        </div>

        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = index === 0;
            return (
              <button
                key={item.id}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-brand-accent/20 text-brand-accent" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-10">
          <Link href={isRtl ? "/ar" : "/"} className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm text-white/85 hover:bg-white/10">
            <LayoutDashboard className="h-4.5 w-4.5" />
            {copy.viewSite}
          </Link>
          <button className="flex w-full items-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm text-white/85 hover:bg-white/10">
            <LogOut className="h-4.5 w-4.5" />
            {copy.signOut}
          </button>
        </div>
      </aside>

      <div className={`${isRtl ? "mr-[280px]" : "ml-[280px]"}`}>
        <header className="sticky top-0 z-30 border-b border-brand-dark/10 bg-brand-light/90 backdrop-blur-md">
          <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between gap-4 px-6">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark">{copy.title}</h2>
              <p className="text-sm text-brand-dark/65">{copy.sub}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative rounded-xl border border-brand-dark/15 bg-white p-2.5 text-brand-dark/80 hover:bg-brand-dark/[0.03]">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-primary" />
              </button>
              <button className="rounded-xl border border-brand-dark/15 bg-white p-2.5 text-brand-dark/80 hover:bg-brand-dark/[0.03]">
                <UserCircle2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] space-y-8 px-6 py-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {s.map((item) => (
              <article key={item.label} className="rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-soft">
                <p className="text-sm text-brand-dark/60">{item.label}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-3xl font-bold tracking-tight text-brand-dark">{item.value}</p>
                  <span className="rounded-full bg-brand-primary/12 px-2.5 py-1 text-xs font-semibold text-brand-dark">{item.delta}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-brand-dark/10 bg-white p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="relative w-full md:max-w-xl">
              <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-brand-dark/40`} />
              <input
                className={`h-11 w-full rounded-xl border border-brand-dark/15 bg-brand-light px-10 text-sm text-brand-dark placeholder:text-brand-dark/45 focus:border-brand-primary focus:outline-none`}
                placeholder={copy.search}
              />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-dark">
              <Clock3 className="h-3.5 w-3.5" />
              {copy.live}
            </span>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <article className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-brand-dark/10 px-5 py-4">
                <h3 className="text-base font-semibold text-brand-dark">{copy.tableTitle}</h3>
                <span className="text-xs text-brand-dark/55">{orders.length} {isRtl ? "سجل" : "records"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-brand-light/70 text-right text-xs text-brand-dark/55">
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">{isRtl ? "المشروع" : "Project"}</th>
                      <th className="px-4 py-3 font-semibold">{isRtl ? "الفئة" : "Category"}</th>
                      <th className="px-4 py-3 font-semibold">{isRtl ? "الحالة" : "Status"}</th>
                      <th className="px-4 py-3 font-semibold">{isRtl ? "القيمة" : "Amount"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((row) => (
                      <tr key={row.id} className="border-t border-brand-dark/8 text-sm text-brand-dark/90">
                        <td className="px-4 py-3 font-semibold">{row.id}</td>
                        <td className="px-4 py-3">{row.project}</td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-soft">
              <h3 className="text-base font-semibold text-brand-dark">{copy.activityTitle}</h3>
              <ul className="mt-5 space-y-4">
                {copy.activity.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-primary" />
                    <p className="text-sm leading-7 text-brand-dark/80">{item}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl border border-brand-dark/10 bg-brand-light p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark/55">{isRtl ? "معدل الإنجاز" : "Fulfillment"}</p>
                <p className="mt-2 text-2xl font-bold text-brand-dark">86%</p>
                <div className="mt-3 h-2 w-full rounded-full bg-brand-dark/10">
                  <div className="h-2 w-[86%] rounded-full bg-brand-primary" />
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
