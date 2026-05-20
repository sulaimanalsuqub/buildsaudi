// ─── Status Labels ───────────────────────────────────────────────────────────
// مصدر واحد لجميع حالات الطلبات — لا تعريف مكرر في الصفحات
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:                    { label: "جديد",               color: "bg-amber-100 text-amber-700" },
  admin_approved:         { label: "معتمد",              color: "bg-blue-100 text-blue-700" },
  rfq_sent:               { label: "RFQ أُرسل",          color: "bg-purple-100 text-purple-700" },
  vendor_quotes_received: { label: "استُلمت عروض",       color: "bg-indigo-100 text-indigo-700" },
  freight_sent:           { label: "أُرسل للشحن",        color: "bg-cyan-100 text-cyan-700" },
  freight_received:       { label: "استُلم سعر الشحن",  color: "bg-teal-100 text-teal-700" },
  offer_sent:             { label: "عرض أُرسل للعميل",  color: "bg-lime-100 text-lime-700" },
  client_approved:        { label: "العميل وافق",        color: "bg-green-100 text-green-700" },
  payment_pending:        { label: "بانتظار الدفع",      color: "bg-orange-100 text-orange-700" },
  payment_confirmed:      { label: "الدفع مؤكد",         color: "bg-emerald-100 text-emerald-700" },
  in_delivery:            { label: "قيد التوصيل",        color: "bg-sky-100 text-sky-700" },
  done:                   { label: "مكتمل",              color: "bg-green-100 text-green-800" },
  cancelled:              { label: "ملغي",               color: "bg-red-100 text-red-700" },
};

// الحالات التي لا يمكن حذف طلب فيها
export const PROTECTED_QUOTE_STATUSES = [
  "client_approved",
  "payment_pending",
  "payment_confirmed",
  "in_delivery",
  "done",
] as const;

// الحالات التي يمكن تعديل أصناف الطلب فيها فقط
export const EDITABLE_QUOTE_STATUSES = ["new", "admin_approved"] as const;

// الحد الأقصى للسعر المقبول (ر.س)
export const MAX_PRICE = 999_999_999;
