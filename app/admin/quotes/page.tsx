import { createClient } from "@/lib/supabase/server";
import { ApproveQuoteButton } from "./approve-button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:                     { label: "جديد", color: "bg-amber-100 text-amber-700" },
  admin_approved:          { label: "معتمد", color: "bg-blue-100 text-blue-700" },
  rfq_sent:                { label: "RFQ أُرسل", color: "bg-purple-100 text-purple-700" },
  vendor_quotes_received:  { label: "استُلمت عروض", color: "bg-indigo-100 text-indigo-700" },
  freight_sent:            { label: "أُرسل للشحن", color: "bg-cyan-100 text-cyan-700" },
  freight_received:        { label: "استُلم سعر الشحن", color: "bg-teal-100 text-teal-700" },
  offer_sent:              { label: "عرض أُرسل للعميل", color: "bg-lime-100 text-lime-700" },
  client_approved:         { label: "العميل وافق", color: "bg-green-100 text-green-700" },
  payment_pending:         { label: "بانتظار الدفع", color: "bg-orange-100 text-orange-700" },
  payment_confirmed:       { label: "الدفع مؤكد", color: "bg-emerald-100 text-emerald-700" },
  in_delivery:             { label: "قيد التوصيل", color: "bg-sky-100 text-sky-700" },
  done:                    { label: "مكتمل", color: "bg-green-100 text-green-800" },
  cancelled:               { label: "ملغي", color: "bg-red-100 text-red-700" },
};

export default async function AdminQuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">طلبات التسعير</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">جميع الطلبات الواردة من العملاء</p>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#1D3F1F]/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]/60 text-right text-xs font-semibold text-[#1D3F1F]/50">
              <th className="px-4 py-3">المشروع</th>
              <th className="px-4 py-3">العميل</th>
              <th className="px-4 py-3">الجوال</th>
              <th className="px-4 py-3">التسليم</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">تاريخ الطلب</th>
              <th className="px-4 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3F1F]/[0.06]">
            {!quotes || quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#1D3F1F]/40">
                  لا توجد طلبات بعد
                </td>
              </tr>
            ) : (
              quotes.map((q) => {
                const status = STATUS_LABELS[q.status] ?? { label: q.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={q.id} className="cursor-pointer hover:bg-[#F4F3EB]/40" onClick={() => {}}>
                    <td className="px-4 py-3 font-medium text-[#1D3F1F]">
                      <a href={`/admin/quotes/${q.id}`} className="hover:text-[#09B14B]">{q.project_name}</a>
                    </td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70">{q.client_name}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70" dir="ltr">{q.phone}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70">{q.delivery_address}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1D3F1F]/50" dir="ltr">
                      {new Date(q.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      {q.status === "new" && <ApproveQuoteButton id={q.id} />}
                      {q.status !== "new" && (
                        <span className="text-xs text-[#1D3F1F]/30">—</span>
                      )}
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
