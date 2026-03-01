import { createClient } from "@/lib/supabase/server";
import { UploadContractForm } from "./upload-contract-form";
import { SendContractButton } from "./send-contract-button";

export default async function AdminContractsPage() {
  const supabase = await createClient();

  // Active contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Signatures (with vendor info)
  const { data: signatures } = contract
    ? await supabase
        .from("vendor_contract_signatures")
        .select("*, vendors(establishment_name, email, contact_number)")
        .eq("contract_id", contract.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // All active vendors (for "send to unsigned" feature)
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, establishment_name, email")
    .eq("status", "active")
    .order("establishment_name");

  const signedVendorIds = new Set(
    (signatures ?? []).filter((s) => s.signed_at).map((s) => s.vendor_id)
  );
  const sentVendorIds = new Set(
    (signatures ?? []).map((s) => s.vendor_id)
  );
  const unsignedVendors = (vendors ?? []).filter((v) => !signedVendorIds.has(v.id));
  const unsentVendors = (vendors ?? []).filter((v) => !sentVendorIds.has(v.id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">عقود الموردين</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">إدارة العقد الموحّد وتتبع التوقيعات</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left: Upload + current contract */}
        <div className="lg:col-span-1 space-y-4">

          {/* Current Contract */}
          {contract ? (
            <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">العقد الحالي</h2>
              <p className="font-medium text-[#1D3F1F]">{contract.title}</p>
              <p className="mt-1 text-xs text-[#1D3F1F]/40">
                {new Date(contract.created_at).toLocaleDateString("ar-SA", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
              <a
                href={contract.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#1D3F1F]/10 bg-[#F4F3EB] px-3 py-1.5 text-xs font-medium text-[#1D3F1F] hover:bg-[#1D3F1F]/10"
              >
                📄 عرض العقد
              </a>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[#F4F3EB] p-2">
                  <p className="text-lg font-bold text-[#1D3F1F]">{vendors?.length ?? 0}</p>
                  <p className="text-[10px] text-[#1D3F1F]/50">الموردين</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2">
                  <p className="text-lg font-bold text-emerald-700">{signedVendorIds.size}</p>
                  <p className="text-[10px] text-emerald-600">وقّعوا</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-2">
                  <p className="text-lg font-bold text-orange-700">{unsignedVendors.length}</p>
                  <p className="text-[10px] text-orange-600">لم يوقّعوا</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#1D3F1F]/20 bg-white p-5 text-center text-sm text-[#1D3F1F]/40">
              لا يوجد عقد حالي
            </div>
          )}

          {/* Upload New Contract */}
          <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">رفع عقد جديد</h2>
            <UploadContractForm />
          </div>

          {/* Send to unsigned */}
          {contract && unsentVendors.length > 0 && (
            <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
              <h2 className="mb-1 text-sm font-semibold text-[#1D3F1F]/50">إرسال للموردين الجدد</h2>
              <p className="mb-3 text-xs text-[#1D3F1F]/40">{unsentVendors.length} مورد لم يُرسَل لهم العقد بعد</p>
              <SendContractButton
                contractId={contract.id}
                vendors={unsentVendors}
                label="إرسال للكل"
              />
            </div>
          )}
        </div>

        {/* Right: Signatures table */}
        <div className="lg:col-span-2">
          <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white overflow-hidden">
            <div className="border-b border-[#1D3F1F]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#1D3F1F]/70">حالة التوقيعات</h2>
            </div>
            {!signatures || signatures.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#1D3F1F]/40">
                لا توجد توقيعات بعد
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]/60 text-right text-xs font-semibold text-[#1D3F1F]/50">
                    <th className="px-4 py-3">المورد</th>
                    <th className="px-4 py-3">البريد</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3">تاريخ التوقيع</th>
                    <th className="px-4 py-3">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D3F1F]/[0.06]">
                  {signatures.map((sig) => {
                    const vendor = sig.vendors as { establishment_name: string; email: string; contact_number: string } | null;
                    return (
                      <tr key={sig.id} className="hover:bg-[#F4F3EB]/30">
                        <td className="px-4 py-3 font-medium text-[#1D3F1F]">
                          {vendor?.establishment_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#1D3F1F]/60 text-xs" dir="ltr">
                          {vendor?.email ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {sig.signed_at ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              ✓ وقّع
                            </span>
                          ) : (
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                              بانتظار التوقيع
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#1D3F1F]/50 text-xs" dir="ltr">
                          {sig.signed_at
                            ? new Date(sig.signed_at).toLocaleDateString("ar-SA")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {!sig.signed_at && (
                            <SendContractButton
                              contractId={sig.contract_id}
                              vendors={vendor ? [{ id: sig.vendor_id, establishment_name: vendor.establishment_name, email: vendor.email }] : []}
                              label="إعادة إرسال"
                              small
                            />
                          )}
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
