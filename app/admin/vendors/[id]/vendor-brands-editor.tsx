"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  name: string;
}

interface Props {
  vendorId: string;
  assignedBrands: Brand[];
  allBrands: Brand[];
}

export function VendorBrandsEditor({ vendorId, assignedBrands, allBrands }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const assignedIds = new Set(assignedBrands.map((b) => b.id));
  const unassigned = allBrands.filter((b) => !assignedIds.has(b.id));

  const addBrand = async (brandId: string) => {
    setLoading(brandId);
    const supabase = createClient();
    await supabase.from("vendor_brands").insert({ vendor_id: vendorId, brand_id: brandId });
    router.refresh();
    setLoading(null);
  };

  const removeBrand = async (brandId: string) => {
    setLoading(brandId);
    const supabase = createClient();
    await supabase
      .from("vendor_brands")
      .delete()
      .eq("vendor_id", vendorId)
      .eq("brand_id", brandId);
    router.refresh();
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      {/* Assigned brands */}
      {assignedBrands.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {assignedBrands.map((brand) => (
            <span
              key={brand.id}
              className="flex items-center gap-1.5 rounded-full bg-[#09B14B]/10 px-3 py-1 text-xs font-medium text-[#09B14B]"
            >
              {brand.name}
              <button
                onClick={() => removeBrand(brand.id)}
                disabled={loading === brand.id}
                className="text-[#09B14B]/60 hover:text-red-500 disabled:opacity-40 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#1D3F1F]/30">لا توجد علامات مرتبطة</p>
      )}

      {/* Add from unassigned */}
      {unassigned.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-[#1D3F1F]/40">إضافة علامة:</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((brand) => (
              <button
                key={brand.id}
                onClick={() => addBrand(brand.id)}
                disabled={loading === brand.id}
                className="rounded-full border border-[#1D3F1F]/15 bg-white px-3 py-1 text-xs text-[#1D3F1F]/60 hover:border-[#09B14B] hover:text-[#09B14B] disabled:opacity-40 transition-colors"
              >
                + {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {allBrands.length === 0 && (
        <p className="text-xs text-[#1D3F1F]/30">
          لا توجد علامات في النظام —{" "}
          <a href="/admin/brands" className="text-[#09B14B] hover:underline">أضف علامات أولاً</a>
        </p>
      )}
    </div>
  );
}
