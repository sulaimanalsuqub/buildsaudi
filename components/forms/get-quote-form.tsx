"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, FileUp, MailCheck, SearchCheck, Send, Truck } from "lucide-react";

// التحقق من رقم الهاتف السعودي: 05xxxxxxxx أو +9665xxxxxxxx
function isValidSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, "");
  return /^(05\d{8}|\+9665\d{8}|009665\d{8})$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type GetQuoteFormProps = {
  isRtl?: boolean;
};

const STORAGE_KEY = "build-quote-form-draft";

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
    email: "البريد الإلكتروني",
    emailPlaceholder: "example@company.com",
    materials: "المواد المطلوبة",
    materialsPlaceholder: "صف المواد التي يحتاجها مشروعك (نوع المادة، الكميات التقريبية...)",
    boqFile: "ملف الكميات أو قائمة المواد",
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
    invalidPhone: "رقم الهاتف غير صحيح (مثال: 05xxxxxxxx)",
    invalidEmail: "البريد الإلكتروني غير صحيح",
    fileTooLarge: "حجم الملف يتجاوز 10 ميجابايت",
    fileUploadError: "فشل رفع الملف. حاول مجدداً.",
    chooseFile: "اختر ملفاً",
    noFileChosen: "لم يُختر ملف",
    orDivider: "أو",
    stepText: "الخطوة",
    ofText: "من",
    steps: ["معلومات العميل", "تفاصيل المشروع", "التوصيل", "مراجعة وإرسال"],
    back: "السابق",
    next: "متابعة",
    review: "مراجعة البيانات",
    notProvided: "غير محدد",
    timelineTitle: "ماذا بعد؟",
    timelineSteps: [
      "تم استلام طلبك",
      "مراجعة الطلب من فريقنا",
      "إرسال عرض السعر لك",
      "موافقتك على العرض",
      "توصيل المواد للموقع",
    ],
    contactMethod: "طريقة التواصل المفضلة لعرض السعر",
    contactMethodEmail: "بريد إلكتروني",
    contactMethodWhatsapp: "واتساب",
    contactMsg: "سنتواصل معك على",
    contactTime: "خلال 24-48 ساعة",
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
    email: "Email Address",
    emailPlaceholder: "example@company.com",
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
    invalidPhone: "Invalid phone number (e.g. 05xxxxxxxx)",
    invalidEmail: "Invalid email address",
    fileTooLarge: "File size exceeds 10MB",
    fileUploadError: "File upload failed. Please try again.",
    chooseFile: "Choose File",
    noFileChosen: "No file chosen",
    orDivider: "or",
    stepText: "Step",
    ofText: "of",
    steps: ["Client Info", "Project Details", "Delivery", "Review & Submit"],
    back: "Back",
    next: "Continue",
    review: "Review Details",
    notProvided: "Not provided",
    timelineTitle: "What's Next?",
    timelineSteps: [
      "Request received",
      "Our team reviews your request",
      "We send you a price quote",
      "You approve the offer",
      "Materials delivered to site",
    ],
    contactMethod: "Preferred contact method for the quote",
    contactMethodEmail: "Email",
    contactMethodWhatsapp: "WhatsApp",
    contactMsg: "We'll contact you at",
    contactTime: "within 24-48 hours",
  },
};

const TOTAL_STEPS = 4;

export function GetQuoteForm({ isRtl = false }: GetQuoteFormProps) {
  const copy = isRtl ? t.ar : t.en;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [quoteRef, setQuoteRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    phone: "",
    email: "",
    contactMethod: "whatsapp" as "email" | "whatsapp",
    materials: "",
    deliveryAddress: "",
    deliveryDate: "",
    notes: "",
  });

  // تحميل المسودة من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // حفظ المسودة تلقائياً
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.clientName.trim()) e.clientName = copy.required;
      if (!form.phone.trim()) {
        e.phone = copy.required;
      } else if (!isValidSaudiPhone(form.phone)) {
        e.phone = copy.invalidPhone;
      }
      if (!form.email.trim()) {
        e.email = copy.required;
      } else if (!isValidEmail(form.email)) {
        e.email = copy.invalidEmail;
      }
    } else if (s === 1) {
      if (!form.projectName.trim()) e.projectName = copy.required;
      if (!form.materials.trim() && selectedFiles.length === 0) e.materials = copy.required;
      if (selectedFiles.some((f) => f.size > 10 * 1024 * 1024)) e.boqFile = copy.fileTooLarge;
    } else if (s === 2) {
      if (!form.deliveryAddress.trim()) e.deliveryAddress = copy.required;
      if (!form.deliveryDate) e.deliveryDate = copy.required;
    }
    return e;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < TOTAL_STEPS - 1) return;

    setLoading(true);
    try {
      // رفع الملفات عبر API server-side
      let boqFileUrl: string | null = null;
      let boqFileName: string | null = null;
      let boqExtractedText = "";
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadForm = new FormData();
          uploadForm.append("file", file);
          uploadForm.append("folder", "boq");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
          if (!uploadRes.ok) {
            setErrors({ boqFile: copy.fileUploadError });
            setLoading(false);
            return;
          }
          const uploadData = await uploadRes.json();
          if (!boqFileUrl) {
            boqFileUrl = uploadData.url;
            boqFileName = uploadData.fileName ?? null;
          }
          if (uploadData.extractedText) {
            boqExtractedText += (boqExtractedText ? "\n\n---\n\n" : "") + uploadData.extractedText;
          }
        }
      }

      const quoteRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        project_name: form.projectName,
        client_name: form.clientName,
        phone: form.phone,
        client_email: form.email,
        contact_method: form.contactMethod,
        materials: form.materials,
delivery_address: form.deliveryAddress,
        delivery_date: form.deliveryDate,
        notes: form.notes || null,
        boq_file_url: boqFileUrl,
        boq_file_name: boqFileName,
        boq_file_text: boqExtractedText,
        }),
      });
      const quoteData = await quoteRes.json().catch(() => null) as { id?: string; error?: string } | null;
      if (!quoteRes.ok || !quoteData?.id) {
        throw new Error(quoteData?.error ?? "تعذر إرسال الطلب");
      }

      // حفظ الرقم المرجعي
      const refId = quoteData.id.split("-")[0].toUpperCase();
      setQuoteRef(refId);

      // مسح المسودة بعد النجاح
      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
    } catch (error) {
      const fallback = isRtl ? "حدث خطأ أثناء الإرسال. حاول مجدداً." : "Something went wrong. Please try again.";
      setErrors({ submit: error instanceof Error ? error.message : fallback });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setQuoteRef("");
    setSelectedFiles([]);
    setErrors({});
    setStep(0);
    setForm({ projectName: "", clientName: "", phone: "", email: "", contactMethod: "whatsapp", materials: "", deliveryAddress: "", deliveryDate: "", notes: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem(STORAGE_KEY);
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  /* ── شاشة النجاح مع Timeline ── */
  if (submitted) {
    const timelineIcons = [CheckCircle2, SearchCheck, MailCheck, CheckCircle2, Truck];
    return (
      <div className="flex flex-col items-center gap-8 py-10" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/[0.10] text-brand-primary">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-dark">{copy.successTitle}</h2>
          {quoteRef && (
            <div className="mt-4 inline-block rounded-xl border border-brand-dark/10 bg-brand-light px-6 py-3">
              <p className="text-xs text-brand-dark/50">{isRtl ? "رقم الطلب المرجعي" : "Reference Number"}</p>
              <p className="mt-1 text-lg font-bold tracking-wider text-brand-dark" dir="ltr">#{quoteRef}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="w-full max-w-md">
          <h3 className="text-base font-bold text-brand-dark mb-4 text-center">{copy.timelineTitle}</h3>
          <div className="space-y-0">
            {copy.timelineSteps.map((label, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm shrink-0 ${i === 0 ? "bg-brand-primary text-white" : "bg-brand-dark/[0.08] text-brand-dark/60"}`}>
                    {(() => {
                      const Icon = timelineIcons[i];
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                  {i < copy.timelineSteps.length - 1 && (
                    <div className="w-0.5 h-6 bg-brand-dark/10" />
                  )}
                </div>
                <p className={`pt-2 text-sm ${i === 0 ? "font-semibold text-brand-dark" : "text-brand-dark/65"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* رسالة التواصل */}
        <p className="text-sm text-brand-dark/60 text-center max-w-md">
          {copy.contactMsg} <span className="font-semibold text-brand-dark" dir="ltr">{form.email}</span> {copy.contactTime}
        </p>

        <button
          onClick={reset}
          className="rounded-full border border-brand-dark/20 px-8 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/[0.04]"
        >
          {copy.successBtn}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-brand-dark/65">
            {copy.stepText} {step + 1} {copy.ofText} {TOTAL_STEPS}
          </p>
          <p className="text-xs font-semibold text-brand-dark">{copy.steps[step]}</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-brand-dark/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.28 }}
            className="h-full rounded-full bg-brand-primary"
          />
        </div>
        <div className="grid gap-2 pt-2 sm:grid-cols-4">
          {copy.steps.map((label, index) => (
            <div
              key={label}
              className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold leading-5 ${
                index <= step ? "border-brand-primary/30 bg-brand-primary/10 text-brand-dark" : "border-brand-dark/10 bg-brand-light/50 text-brand-dark/46"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="space-y-5">
        {/* الخطوة 1: معلومات العميل */}
        {step === 0 && (
          <>
            <Field label={copy.clientName} error={errors.clientName} required>
              <input
                type="text"
                placeholder={copy.clientNamePlaceholder}
                value={form.clientName}
                onChange={(e) => set("clientName", e.target.value)}
                className={inputCls(!!errors.clientName)}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
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
              <Field label={copy.email} error={errors.email} required>
                <input
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls(!!errors.email)}
                  dir="ltr"
                />
              </Field>
              <Field label={copy.contactMethod}>
                <div className="grid grid-cols-2 gap-3">
                  {(["whatsapp", "email"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => set("contactMethod", method)}
                      className={[
                        "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                        form.contactMethod === method
                          ? "border-brand-primary bg-brand-primary/8 text-brand-dark"
                          : "border-brand-dark/15 bg-white text-brand-dark/60 hover:border-brand-dark/30",
                      ].join(" ")}
                    >
                      {method === "whatsapp" ? "📱" : "📧"}
                      {method === "whatsapp" ? copy.contactMethodWhatsapp : copy.contactMethodEmail}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </>
        )}

        {/* الخطوة 2: تفاصيل المشروع */}
        {step === 1 && (
          <>
            <Field label={copy.projectName} error={errors.projectName} required>
              <input
                type="text"
                placeholder={copy.projectNamePlaceholder}
                value={form.projectName}
                onChange={(e) => set("projectName", e.target.value)}
                className={inputCls(!!errors.projectName)}
              />
            </Field>
            <Field label={copy.materials} error={errors.materials} required>
              <textarea
                rows={3}
                placeholder={copy.materialsPlaceholder}
                value={form.materials}
                onChange={(e) => set("materials", e.target.value)}
                className={inputCls(!!errors.materials) + " resize-none"}
              />
            </Field>
            <Field label={copy.boqFile}>
              <div
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 bg-white px-4 py-3 transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-5 w-5 shrink-0 text-brand-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-dark">
                    {selectedFiles.length > 0
                      ? isRtl ? `${selectedFiles.length} ملف${selectedFiles.length > 1 ? " مرفق" : " مرفق"}` : `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                      : copy.chooseFile}
                  </p>
                  {selectedFiles.length === 0 && <p className="text-xs text-brand-dark/45 mt-0.5">{copy.boqFileHint}</p>}
                </div>
                <span className="text-xs text-brand-primary font-medium">
                  {isRtl ? "+ إضافة" : "+ Add"}
                </span>
              </div>
              {selectedFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {selectedFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-brand-dark/8 bg-white px-3 py-2 text-xs">
                      <span className="truncate text-brand-dark/70 max-w-[80%]">{f.name}</span>
                      <button
                        type="button"
                        className="text-brand-dark/35 hover:text-red-500 transition-colors ms-2 shrink-0"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf,.csv"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) {
                    setSelectedFiles((prev) => [...prev, ...files]);
                    setErrors((p) => ({ ...p, boqFile: "" }));
                    e.target.value = "";
                  }
                }}
              />
              {errors.boqFile && <p className="text-xs text-red-500 mt-1">{errors.boqFile}</p>}
            </Field>
          </>
        )}

        {/* الخطوة 3: التوصيل */}
        {step === 2 && (
          <>
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
            <Field label={copy.notes}>
              <textarea
                rows={3}
                placeholder={copy.notesPlaceholder}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={inputCls(false) + " resize-none"}
              />
            </Field>
          </>
        )}

        {/* الخطوة 4: مراجعة */}
        {step === 3 && (
          <div className="rounded-xl border border-brand-dark/12 bg-brand-light/45 p-5">
            <h3 className="text-base font-bold text-brand-dark mb-4">{copy.review}</h3>
            <dl className="grid gap-3 text-sm text-brand-dark/85 sm:grid-cols-2">
              <ReviewRow label={copy.clientName} value={form.clientName || copy.notProvided} />
              <ReviewRow label={copy.phone} value={form.phone || copy.notProvided} dir="ltr" />
              <ReviewRow label={copy.email} value={form.email || copy.notProvided} dir="ltr" />
              <ReviewRow label={copy.contactMethod} value={form.contactMethod === "whatsapp" ? copy.contactMethodWhatsapp : copy.contactMethodEmail} />
              <ReviewRow label={copy.projectName} value={form.projectName || copy.notProvided} />
              <ReviewRow label={copy.materials} value={form.materials || copy.notProvided} className="sm:col-span-2" />
              {selectedFiles.length > 0 && <ReviewRow label={copy.boqFile} value={selectedFiles.map((f) => f.name).join("، ")} />}
              <ReviewRow label={copy.deliveryAddress} value={form.deliveryAddress || copy.notProvided} />
              <ReviewRow label={copy.deliveryDate} value={form.deliveryDate || copy.notProvided} dir="ltr" />
              {form.notes && <ReviewRow label={copy.notes} value={form.notes} className="sm:col-span-2" />}
            </dl>
          </div>
        )}
      </motion.div>

      {errors.submit && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-full border border-brand-dark/20 px-6 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/[0.04] disabled:opacity-40"
        >
          <BackArrow className="h-4 w-4" />
          {copy.back}
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
          >
            {copy.next}
            <DirectionArrow className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? copy.submitting : copy.submit}
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
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

function ReviewRow({ label, value, dir, className }: { label: string; value: string; dir?: string; className?: string }) {
  return (
    <div className={`rounded-lg bg-white p-3 ${className ?? ""}`}>
      <dt className="text-xs font-semibold text-brand-dark/70">{label}</dt>
      <dd className="text-sm mt-1 text-brand-dark break-words" dir={dir}>{value}</dd>
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
