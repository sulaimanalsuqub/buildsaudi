"use client";

import { useRef, useState } from "react";

type GetQuoteFormProps = {
  isRtl?: boolean;
};

const t = {
  ar: {
    pageTitle: "اطلب عرض سعر",
    pageSubtitle: "أرسل تفاصيل مشروعك وسيتواصل معك فريقنا خلال 24 ساعة بعرض سعر شامل.",
    projectName: "اسم المشروع",
    projectNamePlaceholder: "مثال: فيلا الرياض – قطعة 14",
    clientName: "اسم العميل / الشركة",
    clientNamePlaceholder: "مثال: شركة الإنشاءات المتحدة",
    phone: "رقم التواصل",
    phonePlaceholder: "05xxxxxxxx",
    materials: "المواد المطلوبة",
    materialsPlaceholder: "صف المواد التي يحتاجها مشروعك (نوع المادة، الكميات التقريبية...)",
    boqFile: "ملف BOQ أو جدول الكميات",
    boqFilePlaceholder: "ارفع ملف Excel أو PDF",
    boqFileHint: "Excel, PDF — حجم أقصى 10MB",
    sheetLink: "أو رابط Google Sheet / جدول أونلاين",
    sheetLinkPlaceholder: "https://docs.google.com/...",
    deliveryAddress: "عنوان التسليم",
    deliveryAddressPlaceholder: "المدينة، الحي، الشارع",
    deliveryDate: "تاريخ التسليم المطلوب",
    notes: "ملاحظات إضافية",
    notesPlaceholder: "أي تفاصيل أخرى تريد إضافتها...",
    submit: "أرسل الطلب",
    submitting: "جارٍ الإرسال...",
    successTitle: "تم استلام طلبك!",
    successMsg: "شكراً لك. سيتواصل معك فريق بيلد خلال 24 ساعة بعرض سعر مفصّل لمشروعك.",
    successBtn: "إرسال طلب آخر",
    required: "هذا الحقل مطلوب",
    chooseFile: "اختر ملفاً",
    noFileChosen: "لم يُختر ملف",
    orDivider: "أو",
  },
  en: {
    pageTitle: "Request a Quote",
    pageSubtitle: "Send your project details and our team will contact you within 24 hours with a full price quote.",
    projectName: "Project Name",
    projectNamePlaceholder: "e.g. Villa Al Riyadh – Plot 14",
    clientName: "Client / Company Name",
    clientNamePlaceholder: "e.g. United Construction Co.",
    phone: "Contact Number",
    phonePlaceholder: "+966 5x xxx xxxx",
    materials: "Required Materials",
    materialsPlaceholder: "Describe the materials your project needs (type, approximate quantities...)",
    boqFile: "BOQ or Quantity Schedule File",
    boqFilePlaceholder: "Upload Excel or PDF file",
    boqFileHint: "Excel, PDF — max 10MB",
    sheetLink: "Or Google Sheet / Online Table Link",
    sheetLinkPlaceholder: "https://docs.google.com/...",
    deliveryAddress: "Delivery Address",
    deliveryAddressPlaceholder: "City, District, Street",
    deliveryDate: "Required Delivery Date",
    notes: "Additional Notes",
    notesPlaceholder: "Any other details you'd like to add...",
    submit: "Submit Request",
    submitting: "Submitting...",
    successTitle: "Request Received!",
    successMsg: "Thank you. The Build team will contact you within 24 hours with a detailed quote for your project.",
    successBtn: "Submit Another Request",
    required: "This field is required",
    chooseFile: "Choose File",
    noFileChosen: "No file chosen",
    orDivider: "or",
  },
};

export function GetQuoteForm({ isRtl = false }: GetQuoteFormProps) {
  const copy = isRtl ? t.ar : t.en;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    phone: "",
    materials: "",
    sheetLink: "",
    deliveryAddress: "",
    deliveryDate: "",
    notes: "",
  });

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectName.trim()) e.projectName = copy.required;
    if (!form.clientName.trim()) e.clientName = copy.required;
    if (!form.phone.trim()) e.phone = copy.required;
    if (!form.materials.trim()) e.materials = copy.required;
    if (!form.deliveryAddress.trim()) e.deliveryAddress = copy.required;
    if (!form.deliveryDate) e.deliveryDate = copy.required;
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setFileName("");
    setErrors({});
    setForm({ projectName: "", clientName: "", phone: "", materials: "", sheetLink: "", deliveryAddress: "", deliveryDate: "", notes: "" });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/[0.10] text-4xl">
          ✅
        </div>
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{copy.successTitle}</h2>
          <p className="mt-3 max-w-md text-brand-dark/60 leading-relaxed">{copy.successMsg}</p>
        </div>
        <button
          onClick={reset}
          className="mt-2 rounded-full border border-brand-dark/20 px-8 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/[0.04]"
        >
          {copy.successBtn}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} dir={isRtl ? "rtl" : "ltr"} className="space-y-5">
      {/* Row: Project + Client */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.projectName} error={errors.projectName} required>
          <input
            type="text"
            placeholder={copy.projectNamePlaceholder}
            value={form.projectName}
            onChange={(e) => set("projectName", e.target.value)}
            className={inputCls(!!errors.projectName)}
          />
        </Field>
        <Field label={copy.clientName} error={errors.clientName} required>
          <input
            type="text"
            placeholder={copy.clientNamePlaceholder}
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            className={inputCls(!!errors.clientName)}
          />
        </Field>
      </div>

      {/* Phone */}
      <Field label={copy.phone} error={errors.phone} required>
        <input
          type="tel"
          placeholder={copy.phonePlaceholder}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          className={inputCls(!!errors.phone)}
          dir="ltr"
        />
      </Field>

      {/* Materials */}
      <Field label={copy.materials} error={errors.materials} required>
        <textarea
          rows={3}
          placeholder={copy.materialsPlaceholder}
          value={form.materials}
          onChange={(e) => set("materials", e.target.value)}
          className={inputCls(!!errors.materials) + " resize-none"}
        />
      </Field>

      {/* BOQ File */}
      <Field label={copy.boqFile}>
        <div
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-dark/15 bg-white px-4 py-3 transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-xl">📎</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-dark truncate">
              {fileName || copy.chooseFile}
            </p>
            {!fileName && <p className="text-xs text-brand-dark/45 mt-0.5">{copy.boqFileHint}</p>}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.pdf,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setFileName(file.name);
          }}
        />
      </Field>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-dark/10" />
        <span className="text-xs text-brand-dark/40 font-medium">{copy.orDivider}</span>
        <div className="flex-1 h-px bg-brand-dark/10" />
      </div>

      {/* Sheet Link */}
      <Field label={copy.sheetLink}>
        <input
          type="url"
          placeholder={copy.sheetLinkPlaceholder}
          value={form.sheetLink}
          onChange={(e) => set("sheetLink", e.target.value)}
          className={inputCls(false)}
          dir="ltr"
        />
      </Field>

      {/* Row: Address + Date */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.deliveryAddress} error={errors.deliveryAddress} required>
          <input
            type="text"
            placeholder={copy.deliveryAddressPlaceholder}
            value={form.deliveryAddress}
            onChange={(e) => set("deliveryAddress", e.target.value)}
            className={inputCls(!!errors.deliveryAddress)}
          />
        </Field>
        <Field label={copy.deliveryDate} error={errors.deliveryDate} required>
          <input
            type="date"
            value={form.deliveryDate}
            onChange={(e) => set("deliveryDate", e.target.value)}
            className={inputCls(!!errors.deliveryDate)}
            dir="ltr"
            min={new Date().toISOString().split("T")[0]}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label={copy.notes}>
        <textarea
          rows={3}
          placeholder={copy.notesPlaceholder}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={inputCls(false) + " resize-none"}
        />
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-primary py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-brand-dark">
        {label}
        {required && <span className="ms-1 text-brand-primary">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full rounded-xl border px-4 py-3 text-sm text-brand-dark outline-none transition-colors",
    "placeholder:text-brand-dark/35 bg-white",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-brand-dark/15 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
  ].join(" ");
}
