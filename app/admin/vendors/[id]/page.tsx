import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VendorStatusButton } from "../status-button";
import { VendorBrandsEditor } from "./vendor-brands-editor";
import { DeleteVendorButton } from "../delete-vendor-button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700" },
  active:   { label: "مفعّل", color: "bg-green-100 text-green-700" },
  paused:   { label: "موقوف", color: "bg-gray-100 text-gray-600" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
};

const VENDOR_TYPE_LABELS: Record<string, string> = {
  direct_manufacturer:   "مصنّع مباشر",
  authorized_distributor: "موزع معتمد",
  exclusive_agent:       "وكيل حصري",
  project_supplier:      "مورد مشاريع",
  importer:              "مستورد",
};

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*, vendor_categories(category), vendor_regions(region), vendor_brands(brand_id, brands(id, name))")
    .eq("id", id)
    .single();

  if (!vendor) notFound();

  // All brands for the editor
  const { data: allBrands } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");

  const status = STATUS_LABELS[vendor.status] ?? { label: vendor.status, color: "bg-gray-100 text-gray-600" };
  const cats = (vendor.vendor_categories as { category: string }[])?.map((c) => c.category) ?? [];
  const regions = (vendor.vendor_regions as { region: string }[])?.map((r) => r.region) ?? [];
  const assignedBrands = (vendor.vendor_brands as { brand_id: string; brands: { id: string; name: string } | null }[])
    ?.map((vb) => vb.brands)
    .filter(Boolean) as { id: string; name: string }[] ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#1D3F1F]/50">
            <Link href="/admin/vendors" className="hover:text-[#09B14B]">الموردون</Link>
            <span>/</span>
            <span>{vendor.establishment_name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#1D3F1F]">{vendor.establishment_name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
              {status.label}
            </span>
            <span className="text-xs text-[#1D3F1F]/40">
              {new Date(vendor.created_at).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VendorStatusButton
            id={vendor.id}
            currentStatus={vendor.status}
            vendorEmail={vendor.email}
            vendorName={vendor.establishment_name}
            managerName={vendor.manager_name}
          />
          <DeleteVendorButton id={vendor.id} redirect />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Contact Info */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">معلومات التواصل</h2>
          <div className="space-y-3">
            <Row label="اسم المسؤول" value={vendor.manager_name} />
            <Row label="رقم الجوال" value={vendor.contact_number} dir="ltr" />
            <Row label="البريد الإلكتروني" value={vendor.email} dir="ltr" />
            <Row label="السجل التجاري" value={vendor.cr_number} dir="ltr" />
          </div>
        </div>

        {/* Business Info */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">معلومات النشاط</h2>
          <div className="space-y-3">
            <Row
              label="نوع المورد"
              value={VENDOR_TYPE_LABELS[vendor.vendor_type] ?? vendor.vendor_type}
            />
            {vendor.represented_brands && (
              <Row label="العلامات التجارية" value={vendor.represented_brands} />
            )}
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${vendor.has_warehouse ? "bg-[#09B14B]" : "bg-[#1D3F1F]/20"}`} />
                <span className="text-sm text-[#1D3F1F]/70">يمتلك مستودع</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${vendor.offers_credit ? "bg-[#09B14B]" : "bg-[#1D3F1F]/20"}`} />
                <span className="text-sm text-[#1D3F1F]/70">يقدم ائتمان</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${vendor.worked_on_gov_projects ? "bg-[#09B14B]" : "bg-[#1D3F1F]/20"}`} />
                <span className="text-sm text-[#1D3F1F]/70">مشاريع حكومية</span>
              </div>
            </div>
            {vendor.offers_credit && vendor.credit_limit && (
              <Row label="حد الائتمان" value={`${vendor.credit_limit.toLocaleString("ar-SA")} ريال`} />
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">الفئات ({cats.length})</h2>
          {cats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <span key={c} className="rounded-full bg-[#09B14B]/10 px-3 py-1 text-xs font-medium text-[#09B14B]">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#1D3F1F]/30">لا توجد فئات</p>
          )}
        </div>

        {/* Regions */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">مناطق التغطية ({regions.length})</h2>
          {regions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <span key={r} className="rounded-full bg-[#C5D92D]/20 px-3 py-1 text-xs font-medium text-[#1D3F1F]">
                  {r}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#1D3F1F]/30">لا توجد مناطق</p>
          )}
        </div>

        {/* Brands */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 sm:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">العلامات التجارية التي يمثّلها</h2>
          <VendorBrandsEditor
            vendorId={vendor.id}
            assignedBrands={assignedBrands}
            allBrands={allBrands ?? []}
          />
        </div>

        {/* Payment Terms */}
        {vendor.payment_terms && vendor.payment_terms.length > 0 && (
          <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 sm:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">شروط الدفع</h2>
            <div className="flex flex-wrap gap-2">
              {(vendor.payment_terms as string[]).map((t) => (
                <span key={t} className="rounded-full border border-[#1D3F1F]/10 bg-[#F4F3EB] px-3 py-1 text-xs font-medium text-[#1D3F1F]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {vendor.notes && (
          <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 sm:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">ملاحظات</h2>
            <p className="text-sm text-[#1D3F1F]/70">{vendor.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div>
      <p className="text-xs text-[#1D3F1F]/40">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#1D3F1F]" dir={dir}>{value}</p>
    </div>
  );
}
