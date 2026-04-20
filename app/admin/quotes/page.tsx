import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { ApproveQuoteButton } from "./approve-button";
import { DeleteQuoteButton } from "./delete-quote-button";

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

const PAGE_SIZE = 20;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) redirect("/");

  const { page: pageParam, status: statusFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("quotes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: quotes, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1D3F1F]">طلبات التسعير</h1>
          <p className="mt-1 text-sm text-[#1D3F1F]/55">
            {count ?? 0} طلب{statusFilter ? ` — ${STATUS_LABELS[statusFilter]?.label ?? statusFilter}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/quotes", label: "الكل", filter: undefined },
            { href: "/admin/quotes?status=new", label: "جديد", filter: "new" },
            { href: "/admin/quotes?status=admin_approved", label: "معتمد", filter: "admin_approved" },
            { href: "/admin/quotes?status=offer_sent", label: "عرض أُرسل", filter: "offer_sent" },
            { href: "/admin/quotes?status=done", label: "مكتمل", filter: "done" },
          ].map((f) => (
            <Link key={f.href} href={f.href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f.filter ? "bg-[#1D3F1F] text-white" : "border border-[#1D3F1F]/15 bg-white text-[#1D3F1F]/70 hover:bg-[#F4F3EB]"}`}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-[16px] border border-[#1D3F1F]/10 bg-white">
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
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[#1D3F1F]/40">لا توجد طلبات بعد</td></tr>
            ) : (
              quotes.map((q) => {
                const status = STATUS_LABELS[q.status] ?? { label: q.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={q.id} className="cursor-pointer hover:bg-[#F4F3EB]/40">
                    <td className="px-4 py-3 font-medium text-[#1D3F1F]">
                      <Link href={`/admin/quotes/${q.id}`} className="hover:text-[#09B14B]">{q.project_name}</Link>
                    </td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70">{q.client_name}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70" dir="ltr">{q.phone}</td>
                    <td className="px-4 py-3 text-[#1D3F1F]/70">{q.delivery_address}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[#1D3F1F]/50" dir="ltr">
                      {new Date(q.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {q.status === "new" && <ApproveQuoteButton id={q.id} />}
                        <DeleteQuoteButton id={q.id} />
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
        {!quotes || quotes.length === 0 ? (
          <div className="rounded-2xl border border-[#1D3F1F]/10 bg-white px-5 py-12 text-center text-[#1D3F1F]/40">لا توجد طلبات بعد</div>
        ) : (
          quotes.map((q) => {
            const status = STATUS_LABELS[q.status] ?? { label: q.status, color: "bg-gray-100 text-gray-600" };
            return (
              <Link key={q.id} href={`/admin/quotes/${q.id}`}
                className="block rounded-2xl border border-[#1D3F1F]/10 bg-white p-4 transition-colors hover:bg-[#F4F3EB]/40">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#1D3F1F]">{q.project_name}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${status.color}`}>{status.label}</span>
                </div>
                <div className="space-y-1 text-xs text-[#1D3F1F]/60">
                  <p>{q.client_name}</p>
                  <p dir="ltr" className="text-left">{q.phone}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p>{q.delivery_address}</p>
                    <p dir="ltr">{new Date(q.created_at).toLocaleDateString("ar-SA")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#1D3F1F]/5" onClick={(e) => e.preventDefault()}>
                  {q.status === "new" && <ApproveQuoteButton id={q.id} />}
                  <DeleteQuoteButton id={q.id} />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[#1D3F1F]/60">
          <span>صفحة {page} من {totalPages} ({count} طلب)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/quotes?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F4F3EB]">السابق</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/quotes?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F4F3EB]">التالي</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}