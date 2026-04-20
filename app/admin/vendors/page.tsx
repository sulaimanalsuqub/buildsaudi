import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { VendorsTable } from "./vendors-table";

const PAGE_SIZE = 20;

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) redirect("/");

  const { page: pageParam, status: statusFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createServiceRoleClient();

  let vendorQuery = supabase
    .from("vendors")
    .select("*, vendor_categories(category), vendor_brands(brands(id, name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter) {
    vendorQuery = vendorQuery.eq("status", statusFilter);
  }

  const [{ data: vendors, count }, { data: allBrands }] = await Promise.all([
    vendorQuery,
    supabase.from("brands").select("id, name").order("name"),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1D3F1F]">الموردون</h1>
          <p className="mt-1 text-sm text-[#1D3F1F]/55">
            {count ?? 0} مورد{statusFilter ? ` — ${statusFilter === "pending" ? "بانتظار المراجعة" : statusFilter === "active" ? "نشط" : statusFilter === "rejected" ? "مرفوض" : statusFilter}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/vendors", label: "الكل", filter: undefined },
            { href: "/admin/vendors?status=pending", label: "بانتظار المراجعة", filter: "pending" },
            { href: "/admin/vendors?status=active", label: "نشط", filter: "active" },
            { href: "/admin/vendors?status=paused", label: "موقوف", filter: "paused" },
            { href: "/admin/vendors?status=rejected", label: "مرفوض", filter: "rejected" },
          ].map((f) => (
            <Link key={f.href} href={f.href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f.filter ? "bg-[#1D3F1F] text-white" : "border border-[#1D3F1F]/15 bg-white text-[#1D3F1F]/70 hover:bg-[#F4F3EB]"}`}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <VendorsTable vendors={vendors ?? []} allBrands={allBrands ?? []} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[#1D3F1F]/60">
          <span>صفحة {page} من {totalPages} ({count} مورد)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/vendors?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F4F3EB]">السابق</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/vendors?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F4F3EB]">التالي</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}