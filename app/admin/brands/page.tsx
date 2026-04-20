import { createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin";
import { AddBrandForm } from "./add-brand-form";
import { DeleteBrandButton } from "./delete-brand-button";

export default async function AdminBrandsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) redirect("/");

  const db = createServiceRoleClient();

  const { data: brands } = await db
    .from("brands")
    .select("*, vendor_brands(vendor_id, vendors(establishment_name))")
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">العلامات التجارية</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">إدارة العلامات وربطها بالموردين</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">إضافة علامة تجارية</h2>
            <AddBrandForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white overflow-hidden">
            <div className="border-b border-[#1D3F1F]/10 px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1D3F1F]/70">
                العلامات المسجّلة ({brands?.length ?? 0})
              </h2>
            </div>

            {!brands || brands.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#1D3F1F]/40">لا توجد علامات بعد</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]/60 text-right text-xs font-semibold text-[#1D3F1F]/50">
                    <th className="px-4 py-3">العلامة التجارية</th>
                    <th className="px-4 py-3">عدد الموردين</th>
                    <th className="px-4 py-3">الموردين</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D3F1F]/[0.06]">
                  {brands.map((brand) => {
                    const vendorBrands = brand.vendor_brands as { vendor_id: string; vendors: { establishment_name: string } | null }[];
                    const vendorNames = vendorBrands.map((vb) => vb.vendors?.establishment_name).filter(Boolean) as string[];
                    return (
                      <tr key={brand.id} className="hover:bg-[#F4F3EB]/30">
                        <td className="px-4 py-3 font-semibold text-[#1D3F1F]">{brand.name}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${vendorNames.length > 0 ? "bg-[#09B14B]/10 text-[#09B14B]" : "bg-[#1D3F1F]/5 text-[#1D3F1F]/40"}`}>
                            {vendorNames.length} مورد
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {vendorNames.slice(0, 3).map((name) => (
                              <span key={name} className="rounded-full border border-[#1D3F1F]/10 bg-[#F4F3EB] px-2 py-0.5 text-xs text-[#1D3F1F]/70">{name}</span>
                            ))}
                            {vendorNames.length > 3 && <span className="text-xs text-[#1D3F1F]/40">+{vendorNames.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <DeleteBrandButton id={brand.id} name={brand.name} vendorCount={vendorNames.length} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}