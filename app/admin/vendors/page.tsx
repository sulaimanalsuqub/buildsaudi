import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { VendorsTable } from "./vendors-table";

const PAGE_SIZE = 20;

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ data: vendors, count }, { data: allBrands }] = await Promise.all([
    supabase
      .from("vendors")
      .select("*, vendor_categories(category), vendor_brands(brands(id, name))", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("brands")
      .select("id, name")
      .order("name"),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">الموردون</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">الموردون المسجلون في المنصة</p>
      </div>
      <VendorsTable vendors={vendors ?? []} allBrands={allBrands ?? []} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[#1D3F1F]/60">
          <span>
            صفحة {page} من {totalPages} ({count} مورد)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/vendors?page=${page - 1}`}
                className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F4F3EB]"
              >
                السابق
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/vendors?page=${page + 1}`}
                className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F4F3EB]"
              >
                التالي
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
