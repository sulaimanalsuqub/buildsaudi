import { createClient } from "@/lib/supabase/server";
import { VendorStatusButton } from "./status-button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700" },
  active:   { label: "مفعّل", color: "bg-green-100 text-green-700" },
  paused:   { label: "موقوف", color: "bg-gray-100 text-gray-600" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
};

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*, vendor_categories(category), vendor_regions(region)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">الموردون</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">الموردون المسجلون في المنصة</p>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#1D3F1F]/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]/60 text-right text-xs font-semibold text-[#1D3F1F]/50">
              <th className="px-4 py-3">المنشأة</th>
              <th className="px-4 py-3">المسؤول</th>
              <th className="px-4 py-3">الجوال</th>
              <th className="px-4 py-3">الفئات</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">تاريخ التسجيل</th>
              <th className="px-4 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3F1F]/[0.06]">
            {!vendors || vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#1D3F1F]/40">
                  لا يوجد موردون بعد
                </td>
              </tr>
            ) : (
              vendors.map((v) => {
                const status = STATUS_LABELS[v.status] ?? { label: v.status, color: "bg-gray-100 text-gray-600" };
                const cats = (v.vendor_categories as { category: string }[])?.map((c) => c.category) ?? [];
                return (
                  <tr key={v.id} className="hover:bg-[#F4F3EB]/40">
                    <td className="px-4 py-3 font-medium text-[#1D3F1F]">{v.establishment_name}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70">{v.manager_name}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70" dir="ltr">{v.contact_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 2).map((c) => (
                          <span key={c} className="rounded-full bg-[#09B14B]/10 px-2 py-0.5 text-xs text-[#09B14B]">
                            {c}
                          </span>
                        ))}
                        {cats.length > 2 && (
                          <span className="text-xs text-[#1D3F1F]/40">+{cats.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1D3F1F]/50" dir="ltr">
                      {new Date(v.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <VendorStatusButton id={v.id} currentStatus={v.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
