import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuoteActions } from "./quote-actions";
import { AdminNotesClient } from "./admin-notes-client";
import { OfferBuilder } from "./offer-builder";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:                    { label: "جديد", color: "bg-amber-100 text-amber-700" },
  admin_approved:         { label: "معتمد", color: "bg-blue-100 text-blue-700" },
  rfq_sent:               { label: "RFQ أُرسل", color: "bg-purple-100 text-purple-700" },
  vendor_quotes_received: { label: "استُلمت عروض", color: "bg-indigo-100 text-indigo-700" },
  freight_sent:           { label: "أُرسل للشحن", color: "bg-cyan-100 text-cyan-700" },
  freight_received:       { label: "استُلم سعر الشحن", color: "bg-teal-100 text-teal-700" },
  offer_sent:             { label: "عرض أُرسل للعميل", color: "bg-lime-100 text-lime-700" },
  client_approved:        { label: "العميل وافق", color: "bg-green-100 text-green-700" },
  payment_pending:        { label: "بانتظار الدفع", color: "bg-orange-100 text-orange-700" },
  payment_confirmed:      { label: "الدفع مؤكد", color: "bg-emerald-100 text-emerald-700" },
  in_delivery:            { label: "قيد التوصيل", color: "bg-sky-100 text-sky-700" },
  done:                   { label: "مكتمل", color: "bg-green-100 text-green-800" },
  cancelled:              { label: "ملغي", color: "bg-red-100 text-red-700" },
};

const FLOW_STEPS = [
  { key: "new", label: "طلب جديد" },
  { key: "admin_approved", label: "اعتماد الأدمن" },
  { key: "rfq_sent", label: "إرسال RFQ" },
  { key: "vendor_quotes_received", label: "عروض الموردين" },
  { key: "freight_sent", label: "إرسال للشحن" },
  { key: "freight_received", label: "سعر الشحن" },
  { key: "offer_sent", label: "عرض للعميل" },
  { key: "client_approved", label: "موافقة العميل" },
  { key: "payment_pending", label: "انتظار الدفع" },
  { key: "payment_confirmed", label: "تأكيد الدفع" },
  { key: "in_delivery", label: "التوصيل" },
  { key: "done", label: "مكتمل" },
];

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  // Fetch existing client offer if any
  const { data: clientOffer } = await supabase
    .from("client_offers")
    .select("materials_total, freight_total, platform_fee, grand_total, status, sent_at, offer_token")
    .eq("quote_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = STATUS_LABELS[quote.status] ?? { label: quote.status, color: "bg-gray-100 text-gray-600" };
  const currentStepIdx = FLOW_STEPS.findIndex((s) => s.key === quote.status);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#1D3F1F]/50">
            <Link href="/admin/quotes" className="hover:text-[#09B14B]">طلبات التسعير</Link>
            <span>/</span>
            <span>{quote.project_name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#1D3F1F]">{quote.project_name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
              {status.label}
            </span>
            <span className="text-xs text-[#1D3F1F]/40">
              {new Date(quote.created_at).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>
        </div>
        <QuoteActions id={quote.id} currentStatus={quote.status} />
      </div>

      {/* Progress Flow */}
      {quote.status !== "cancelled" && (
        <div className="mb-6 overflow-x-auto rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <div className="flex min-w-max items-center gap-0">
            {FLOW_STEPS.map((step, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={[
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      done ? "bg-[#09B14B] text-white" :
                      active ? "bg-[#1D3F1F] text-white" :
                      "bg-[#1D3F1F]/10 text-[#1D3F1F]/30",
                    ].join(" ")}>
                      {done ? "✓" : idx + 1}
                    </div>
                    <span className={[
                      "text-[10px] text-center whitespace-nowrap",
                      active ? "font-semibold text-[#1D3F1F]" : "text-[#1D3F1F]/40",
                    ].join(" ")}>
                      {step.label}
                    </span>
                  </div>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className={[
                      "mx-1 mb-4 h-px w-8",
                      done ? "bg-[#09B14B]" : "bg-[#1D3F1F]/10",
                    ].join(" ")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Client Info */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">معلومات العميل</h2>
          <div className="space-y-3">
            <Row label="اسم العميل" value={quote.client_name} />
            <Row label="رقم الجوال" value={quote.phone} dir="ltr" />
            <Row label="عنوان التسليم" value={quote.delivery_address} />
            <Row
              label="تاريخ التسليم المطلوب"
              value={new Date(quote.delivery_date).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            />
          </div>
        </div>

        {/* Project Info */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">تفاصيل المشروع</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#1D3F1F]/40">المواد المطلوبة</p>
              <p className="mt-1 text-sm text-[#1D3F1F] whitespace-pre-wrap">{quote.materials}</p>
            </div>
            {quote.sheet_link && (
              <div>
                <p className="text-xs text-[#1D3F1F]/40">رابط جدول الكميات</p>
                <a
                  href={quote.sheet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-sm text-[#09B14B] hover:underline"
                  dir="ltr"
                >
                  {quote.sheet_link}
                </a>
              </div>
            )}
            {quote.boq_file_url && (
              <div>
                <p className="text-xs text-[#1D3F1F]/40">ملف BOQ</p>
                <a
                  href={quote.boq_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#1D3F1F]/10 bg-[#F4F3EB] px-3 py-1.5 text-xs font-medium text-[#1D3F1F] hover:bg-[#1D3F1F]/10"
                >
                  📎 تحميل الملف
                </a>
              </div>
            )}
            {quote.notes && (
              <div>
                <p className="text-xs text-[#1D3F1F]/40">ملاحظات العميل</p>
                <p className="mt-1 text-sm text-[#1D3F1F]/70">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Notes */}
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">ملاحظات الأدمن الداخلية</h2>
          <AdminNotesBox id={quote.id} currentNotes={quote.admin_notes ?? ""} />
        </div>

        {/* Offer Builder — shown when ready to send offer */}
        {quote.status === "freight_received" && (
          <div className="sm:col-span-2">
            <OfferBuilder
              quoteId={quote.id}
              clientName={quote.client_name}
              clientEmail={quote.client_email ?? ""}
              projectName={quote.project_name}
              deliveryAddress={quote.delivery_address}
              deliveryDate={new Date(quote.delivery_date).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            />
          </div>
        )}

        {/* Sent Offer Summary */}
        {clientOffer && ["offer_sent", "client_approved", "payment_pending", "payment_confirmed", "in_delivery", "done"].includes(quote.status) && (
          <div className="sm:col-span-2 rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">
              العرض المُرسَل للعميل
              {clientOffer.sent_at && (
                <span className="mr-2 font-normal text-[#1D3F1F]/35">
                  — {new Date(clientOffer.sent_at).toLocaleDateString("ar-SA")}
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-[#1D3F1F]/40">المواد</p>
                <p className="font-semibold text-[#1D3F1F]">{Number(clientOffer.materials_total).toLocaleString("ar-SA")} ر.س</p>
              </div>
              <div>
                <p className="text-xs text-[#1D3F1F]/40">الشحن</p>
                <p className="font-semibold text-[#1D3F1F]">{Number(clientOffer.freight_total).toLocaleString("ar-SA")} ر.س</p>
              </div>
              {clientOffer.platform_fee > 0 && (
                <div>
                  <p className="text-xs text-[#1D3F1F]/40">رسوم المنصة</p>
                  <p className="font-semibold text-[#1D3F1F]">{Number(clientOffer.platform_fee).toLocaleString("ar-SA")} ر.س</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#1D3F1F]/40">الإجمالي DDP</p>
                <p className="text-lg font-bold text-[#09B14B]">{Number(clientOffer.grand_total).toLocaleString("ar-SA")} ر.س</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                clientOffer.status === "accepted" ? "bg-green-100 text-green-700" :
                clientOffer.status === "rejected" ? "bg-red-100 text-red-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {clientOffer.status === "accepted" ? "العميل وافق ✓" :
                 clientOffer.status === "rejected" ? "العميل رفض" : "بانتظار رد العميل"}
              </span>
              {clientOffer.offer_token && (
                <a
                  href={`/offer/${clientOffer.offer_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#09B14B] hover:underline"
                >
                  رابط العرض ↗
                </a>
              )}
            </div>
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

// Inline server component — just renders the client box
function AdminNotesBox({ id, currentNotes }: { id: string; currentNotes: string }) {
  return <AdminNotesClient id={id} currentNotes={currentNotes} />;
}
