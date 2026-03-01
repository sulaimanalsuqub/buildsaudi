import { createClient } from "@/lib/supabase/server";
import { VendorsTable } from "./vendors-table";

export default async function AdminVendorsPage() {
  const supabase = await createClient();

  const [{ data: vendors }, { data: allBrands }] = await Promise.all([
    supabase
      .from("vendors")
      .select("*, vendor_categories(category), vendor_brands(brands(id, name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("brands")
      .select("id, name")
      .order("name"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">الموردون</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">الموردون المسجلون في المنصة</p>
      </div>
      <VendorsTable vendors={vendors ?? []} allBrands={allBrands ?? []} />
    </div>
  );
}
