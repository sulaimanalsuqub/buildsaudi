import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/admin";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { QuoteActions } from "./quote-actions";
import { AdminNotesClient } from "./admin-notes-client";
import { QuoteItemsEditor } from "./quote-items-editor";
import { RfqManager } from "./rfq-manager";
import { VendorQuoteEntry } from "./vendor-quote-entry";
import { FreightQuoteEntry } from "./freight-quote-entry";
import { OfferBuilder } from "./offer-builder";
import { STATUS_LABELS } from "@/lib/constants";

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

const PHASE1_STATUSES = ["admin_approved", "rfq_sent", "vendor_quotes_received", "freight_sent", "freight_received"];
const PHASE2_STATUSES = ["admin_approved", "rfq_sent"];
const PHASE3_STATUSES = ["rfq_sent", "vendor_quotes_received", "freight_sent", "freight_received"];
const PHASE_FREIGHT_STATUSES = ["vendor_quotes_received", "freight_sent", "freight_received"];

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) redirect("/");

  const supabase = createServiceRoleClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const [
    { data: clientOffer },
    { data: quoteItems },
    { data: rfqsRaw },
    { data: activeVendors },
    { data: freightQuotes },
  ] = await Promise.all([
    supabase
      .from("client_offers")
      .select("materials_total, freight_total, platform_fee, grand_total, status, sent_at, offer_token")
      .eq("quote_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("rfqs")
      .select("*, vendors(id, establishment_name, manager_name, email)")
      .eq("quote_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("vendors")
      .select("id, establishment_name, manager_name, email, vendor_categories(category)")
      .eq("status", "active")
      .order("establishment_name"),
    supabase
      .from("freight_quotes")
      .select("*")
      .eq("quote_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const rfqIds = (rfqsRaw ?? []).map((r: { id: string }) => r.id);
  const { data: vendorQuotesRaw } =
    rfqIds.length > 0
      ? await supabase
          .from("vendor_quotes")
          .select("*")
          .in("rfq_id", rfqIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  type VendorQuoteRow = {
    id: string; rfq_id: string; vendor_id: string; total_price: number;
    delivery_days: number | null; notes: string | null; vendorName?: string;
  };
  // استخدام Map بدلاً من find() لتجنب O(n²)
  const rfqMap = new Map((rfqsRaw ?? []).map((r) => [r.id, r]));
  const vendorQuotes: VendorQuoteRow[] = (vendorQuotesRaw ?? []).map((vq) => {
    const rfq = rfqMap.get((vq as { rfq_id: string }).rfq_id);
    const vendor = rfq?.vendors as { establishment_name: string } | null;
    return { ...(vq as VendorQuoteRow), vendorName: vendor?.establishment_name ?? undefined };
  });

  const status = STATUS_LABELS[quote.status] ?? { label: quote.status, color: "bg-gray-100 text-gray-600" };
  const currentStepIdx = FLOW_STEPS.findIndex((s) => s.key === quote.status);

  const showPhase1 = PHASE1_STATUSES.includes(quote.status);
  const showPhase2 = PHASE2_STATUSES.includes(quote.status) && (quoteItems ?? []).length > 0;
  const showPhase3 = PHASE3_STATUSES.includes(quote.status) && (rfqsRaw ?? []).length > 0;
  const showFreightEntry = PHASE_FREIGHT_STATUSES.includes(quote.status);
  const showOfferBuilder = quote.status === "freight_received";
  const showSentOffer =
    !!clientOffer &&
    ["offer_sent", "client_approved", "payment_pending", "payment_confirmed", "in_delivery", "done"].includes(
      quote.status
    );

  return (
    <div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">معلومات العميل</h2>
          <div className="space-y-3">
            <Row label="اسم العميل" value={quote.client_name} />
            <Row label="رقم الجوال" value={quote.phone} dir="ltr" />
            {quote.client_email && <Row label="البريد الإلكتروني" value={quote.client_email} dir="ltr" />}
            <Row label="عنوان التسليم" value={quote.delivery_address} />
            <Row
              label="تاريخ التسليم المطلوب"
              value={new Date(quote.delivery_date).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            />
          </div>
        </div>

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
                <a href={quote.sheet_link} target="_blank" rel="noopener noreferrer"
                  className="mt-1 block truncate text-sm text-[#09B14B] hover:underline" dir="ltr">
                  {quote.sheet_link}
                </a>
              </div>
            )}
            {quote.boq_file_url && (
              <div>
                <p className="text-xs text-[#1D3F1F]/40">ملف BOQ</p>
                <a href={quote.boq_file_url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#1D3F1F]/10 bg-[#F4F3EB] px-3 py-1.5 text-xs font-medium text-[#1D3F1F] hover:bg-[#1D3F1F]/10">
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

        <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-[#1D3F1F]/50">ملاحظات الأدمن الداخلية</h2>
          <AdminNotesClient id={quote.id} currentNotes={quote.admin_notes ?? ""} />
        </div>

        {showPhase1 && (
          <div className="sm:col-span-2">
            <QuoteItemsEditor
              quoteId={quote.id}
              initialItems={quoteItems ?? []}
              materialsText={quote.materials ?? ""}
              quoteStatus={quote.status}
            />
          </div>
        )}

        {showPhase2 && (
          <div className="sm:col-span-2">
            <RfqManager
              quoteId={quote.id}
              quoteItems={quoteItems ?? []}
              initialRfqs={rfqsRaw ?? []}
              activeVendors={activeVendors ?? []}
            />
          </div>
        )}

        {showPhase3 && (
          <div className="sm:col-span-2">
            <VendorQuoteEntry
              initialRfqs={rfqsRaw ?? []}
              initialVendorQuotes={vendorQuotesRaw ?? []}
            />
          </div>
        )}

        {showFreightEntry && (
          <div className="sm:col-span-2">
            <FreightQuoteEntry
              quoteId={quote.id}
              initialFreightQuotes={freightQuotes ?? []}
            />
          </div>
        )}

        {showOfferBuilder && (
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
              initialVendorQuotes={vendorQuotes}
              initialFreightQuotes={freightQuotes ?? []}
            />
          </div>
        )}

        {showSentOffer && clientOffer && (
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
                  <p className="text-xs text-[#1D3F1F]/40">رسوم إضافية</p>
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
                <a href={`/offer/${clientOffer.offer_token}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#09B14B] hover:underline">
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
