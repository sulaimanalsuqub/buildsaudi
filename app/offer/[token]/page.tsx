import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { OfferResponse } from "./offer-response";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س";
}

export default async function OfferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: offer } = await adminSupabase
    .from("client_offers")
    .select("*, quotes(project_name, client_name, delivery_address, delivery_date, materials)")
    .eq("offer_token", token)
    .single();

  if (!offer) notFound();

  const quote = offer.quotes as {
    project_name: string;
    client_name: string;
    delivery_address: string;
    delivery_date: string;
    materials: string;
  };

  const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();
  const isResponded = ["accepted", "rejected"].includes(offer.status);

  return (
    <div className="min-h-screen bg-[#F4F3EB]" dir="rtl">
      {/* Header */}
      <div className="bg-[#1D3F1F] px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs text-white/50">عرض سعر من</p>
            <p className="text-base font-bold text-white">Build Saudi</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-white/50">المشروع</p>
            <p className="text-sm font-semibold text-white">{quote.project_name}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">

        {/* Status Banner */}
        {isExpired && !isResponded && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-5 py-4 text-sm font-semibold text-orange-700">
            ⏰ انتهت صلاحية هذا العرض
          </div>
        )}
        {offer.status === "accepted" && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 text-sm font-semibold text-green-700">
            ✅ تم قبول هذا العرض — سيتواصل معك فريقنا قريباً لإتمام الدفع
          </div>
        )}
        {offer.status === "rejected" && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm font-semibold text-red-700">
            ❌ تم رفض هذا العرض
          </div>
        )}

        {/* Client Greeting */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white px-5 py-4">
          <p className="text-sm text-[#1D3F1F]/70">
            مرحباً <strong className="text-[#1D3F1F]">{quote.client_name}</strong>،
            يسعدنا تقديم عرض السعر التالي لمشروع <strong className="text-[#1D3F1F]">{quote.project_name}</strong>.
          </p>
        </div>

        {/* Price Breakdown */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">تفاصيل السعر</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#1D3F1F]/70">قيمة المواد والتوريد</span>
              <span className="font-semibold text-[#1D3F1F]" dir="ltr">{fmt(offer.materials_total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#1D3F1F]/70">التوصيل والجمارك (DDP)</span>
              <span className="font-semibold text-[#1D3F1F]" dir="ltr">{fmt(offer.freight_total)}</span>
            </div>
            {offer.platform_fee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1D3F1F]/70">رسوم خدمة المنصة</span>
                <span className="font-semibold text-[#1D3F1F]" dir="ltr">{fmt(offer.platform_fee)}</span>
              </div>
            )}
            <div className="border-t border-[#1D3F1F]/10 pt-3 flex items-center justify-between">
              <span className="text-base font-bold text-[#1D3F1F]">الإجمالي DDP</span>
              <span className="text-xl font-bold text-[#09B14B]" dir="ltr">{fmt(offer.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">معلومات التسليم</h2>
          <div className="space-y-2">
            <div className="flex gap-2 text-sm">
              <span className="text-[#1D3F1F]/40 w-28 shrink-0">عنوان التسليم</span>
              <span className="text-[#1D3F1F] font-medium">{quote.delivery_address}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-[#1D3F1F]/40 w-28 shrink-0">تاريخ التسليم</span>
              <span className="text-[#1D3F1F] font-medium">
                {new Date(quote.delivery_date).toLocaleDateString("ar-SA", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">المواد المطلوبة</h2>
          <p className="text-sm text-[#1D3F1F]/80 whitespace-pre-wrap">{quote.materials}</p>
        </div>

        {/* Validity */}
        {!isExpired && !isResponded && offer.expires_at && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-xs text-amber-700">
            ⏳ هذا العرض صالح حتى{" "}
            <strong>
              {new Date(offer.expires_at).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </strong>
          </div>
        )}

        {/* Response Buttons */}
        {!isExpired && !isResponded && (
          <OfferResponse token={token} grandTotal={fmt(offer.grand_total)} />
        )}

        <p className="text-center text-xs text-[#1D3F1F]/30 pb-4">
          Build Saudi · build.sa
        </p>
      </div>
    </div>
  );
}
