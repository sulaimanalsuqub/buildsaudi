"use client";

import { useState } from "react";
import Link from "next/link";
import { VendorStatusButton } from "./status-button";
import { DeleteVendorButton } from "./delete-vendor-button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700" },
  active:   { label: "مفعّل", color: "bg-green-100 text-green-700" },
  paused:   { label: "موقوف", color: "bg-gray-100 text-gray-600" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
};

interface Brand { id: string; name: string }
interface Vendor {
  id: string;
  establishment_name: string;
  manager_name: string;
  contact_number: string;
  email: string;
  status: string;
  created_at: string;
  vendor_categories: { category: string }[];
  vendor_brands: { brands: Brand | null }[];
}

interface Props {
  vendors: Vendor[];
  allBrands: Brand[];
}

export function VendorsTable({ vendors, allBrands }: Props) {
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = vendors.filter((v) => {
    const matchSearch =
      !search ||
      v.establishment_name.includes(search) ||
      v.manager_name.includes(search);

    const matchBrand =
      brandFilter === "all" ||
      v.vendor_brands.some((vb) => vb.brands?.id === brandFilter);

    return matchSearch && matchBrand;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم..."
          className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder:text-[#1D3F1F]/30 focus:border-[#09B14B] focus:outline-none"
        />
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:border-[#09B14B] focus:outline-none"
        >
          <option value="all">كل العلامات التجارية</option>
          {allBrands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {(brandFilter !== "all" || search) && (
          <button
            onClick={() => { setBrandFilter("all"); setSearch(""); }}
            className="text-xs text-[#1D3F1F]/40 hover:text-[#1D3F1F]"
          >
            مسح الفلتر
          </button>
        )}
        <span className="text-xs text-[#1D3F1F]/40 mr-auto">
          {filtered.length} مورد
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-[16px] border border-[#1D3F1F]/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]/60 text-right text-xs font-semibold text-[#1D3F1F]/50">
              <th className="px-4 py-3">المنشأة</th>
              <th className="px-4 py-3">المسؤول</th>
              <th className="px-4 py-3">الجوال</th>
              <th className="px-4 py-3">الفئات</th>
              <th className="px-4 py-3">العلامات التجارية</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">تاريخ التسجيل</th>
              <th className="px-4 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3F1F]/[0.06]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#1D3F1F]/40">
                  لا يوجد موردون مطابقون
                </td>
              </tr>
            ) : (
              filtered.map((v) => {
                const status = STATUS_LABELS[v.status] ?? { label: v.status, color: "bg-gray-100 text-gray-600" };
                const cats = v.vendor_categories?.map((c) => c.category) ?? [];
                const brands = v.vendor_brands?.map((vb) => vb.brands).filter(Boolean) as Brand[];
                return (
                  <tr key={v.id} className="cursor-pointer hover:bg-[#F4F3EB]/40">
                    <td className="px-4 py-3 font-medium text-[#1D3F1F]">
                      <Link href={`/admin/vendors/${v.id}`} className="hover:text-[#09B14B]">
                        {v.establishment_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70">{v.manager_name}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70" dir="ltr">{v.contact_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 2).map((c) => (
                          <span key={c} className="rounded-full bg-[#09B14B]/10 px-2 py-0.5 text-xs text-[#09B14B]">
                            {c}
                          </span>
                        ))}
                        {cats.length > 2 && <span className="text-xs text-[#1D3F1F]/40">+{cats.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {brands.slice(0, 2).map((b) => (
                          <span key={b.id} className="rounded-full border border-[#1D3F1F]/10 bg-[#F4F3EB] px-2 py-0.5 text-xs text-[#1D3F1F]/70">
                            {b.name}
                          </span>
                        ))}
                        {brands.length > 2 && <span className="text-xs text-[#1D3F1F]/40">+{brands.length - 2}</span>}
                        {brands.length === 0 && <span className="text-xs text-[#1D3F1F]/20">—</span>}
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
                      <div className="flex items-center gap-2">
                        <VendorStatusButton
                          id={v.id}
                          currentStatus={v.status}
                          vendorEmail={v.email}
                          vendorName={v.establishment_name}
                          managerName={v.manager_name}
                        />
                        <DeleteVendorButton id={v.id} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#1D3F1F]/10 bg-white px-5 py-12 text-center text-[#1D3F1F]/40">
            لا يوجد موردون مطابقون
          </div>
        ) : (
          filtered.map((v) => {
            const status = STATUS_LABELS[v.status] ?? { label: v.status, color: "bg-gray-100 text-gray-600" };
            const cats = v.vendor_categories?.map((c) => c.category) ?? [];
            const brands = v.vendor_brands?.map((vb) => vb.brands).filter(Boolean) as Brand[];
            return (
              <div key={v.id} className="rounded-2xl border border-[#1D3F1F]/10 bg-white p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/admin/vendors/${v.id}`} className="text-sm font-bold text-[#1D3F1F] hover:text-[#09B14B]">
                    {v.establishment_name}
                  </Link>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[#1D3F1F]/60">
                  <p>{v.manager_name}</p>
                  <p dir="ltr" className="text-left">{v.contact_number}</p>
                </div>
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cats.slice(0, 3).map((c) => (
                      <span key={c} className="rounded-full bg-[#09B14B]/10 px-2 py-0.5 text-xs text-[#09B14B]">
                        {c}
                      </span>
                    ))}
                    {cats.length > 3 && <span className="text-xs text-[#1D3F1F]/40">+{cats.length - 3}</span>}
                  </div>
                )}
                {brands.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {brands.slice(0, 2).map((b) => (
                      <span key={b.id} className="rounded-full border border-[#1D3F1F]/10 bg-[#F4F3EB] px-2 py-0.5 text-xs text-[#1D3F1F]/70">
                        {b.name}
                      </span>
                    ))}
                    {brands.length > 2 && <span className="text-xs text-[#1D3F1F]/40">+{brands.length - 2}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#1D3F1F]/5">
                  <VendorStatusButton
                    id={v.id}
                    currentStatus={v.status}
                    vendorEmail={v.email}
                    vendorName={v.establishment_name}
                    managerName={v.manager_name}
                  />
                  <DeleteVendorButton id={v.id} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
