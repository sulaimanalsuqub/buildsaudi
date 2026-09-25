"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { CheckCircle2, FileText, Loader2, MapPin, MessageSquare, Send, Upload, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  isValidVendorPhone,
  normalizeVendorPhone,
  optionLabel,
  saudiCities,
  textByLang,
} from "@/lib/vendor-options";
import { VendorErrorText } from "@/components/forms/vendor-form-shared";

type PickedFile = { name: string; mimeType: string; base64Data: string; sizeLabel: string };

const MAX_FILES = 5;
const NATIONAL_ADDRESS_PATTERN = /^[A-Za-z]{4}\d{4}$/;

const formSchema = z.object({
  email: z.string().trim().email("invalidEmail"),
  contactName: z.string().trim().min(2, "required"),
  companyName: z.string().optional(),
  phone: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  newProjectName: z.string().trim().min(2, "required"),
  description: z.string().max(200).optional(),
  city: z.string().optional(),
  nationalAddressCode: z
    .string()
    .optional()
    .refine((v) => !v || NATIONAL_ADDRESS_PATTERN.test(v), { message: "invalidNationalAddress" }),
  privacyAccepted: z.literal(true, { message: "required" }),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  email: "",
  contactName: "",
  companyName: "",
  phone: "",
  newProjectName: "",
  description: "",
  city: "",
  nationalAddressCode: "",
  privacyAccepted: false as unknown as true,
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProcurementRequestForm({ isRtl = false }: { isRtl?: boolean }) {
  // Stable for retries/double-clicks during this request attempt; server persists the result durably.
  const [materialMode, setMaterialMode] = useState<"file" | "text">("file");
  const [materialsError, setMaterialsError] = useState("");
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const readingFilesRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [flyKey, setFlyKey] = useState(0);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).onQuoteTurnstileVerified = (token: string) => setTurnstileToken(token);
    (window as unknown as Record<string, unknown>).onQuoteTurnstileExpired = () => setTurnstileToken("");
    return () => {
      delete (window as unknown as Record<string, unknown>).onQuoteTurnstileExpired;
      delete (window as unknown as Record<string, unknown>).onQuoteTurnstileVerified;
    };
  }, []);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: "onChange" });
  const values = useWatch({ control: form.control, defaultValue: defaultValues });

  const toggleFilesPicked = async (fileList: FileList | null) => {
    if (!fileList?.length || readingFilesRef.current) return;
    setFileError("");
    if (files.length + fileList.length > MAX_FILES) {
      setFileError(textByLang(isRtl, "Attach up to 5 files", "يمكن إرفاق 5 ملفات كحد أقصى"));
      return;
    }
    readingFilesRef.current = true;
    setIsReadingFiles(true);
    try {
      const additions: PickedFile[] = [];
      for (const file of Array.from(fileList)) {
        if (!/\.(pdf|csv)$/i.test(file.name)) {
          setFileError(textByLang(isRtl, "Use PDF or CSV. Save Excel sheets as CSV first.", "اختر PDF أو CSV. يمكنك حفظ ملف إكسل بصيغة CSV أولاً."));
          continue;
        }
        if (!file.size || file.size > 8 * 1024 * 1024) {
          setFileError(textByLang(isRtl, "Choose a non-empty file up to 8 MB", "اختر ملفاً غير فارغ لا يتجاوز 8 ميجابايت"));
          continue;
        }
        if (files.some((f) => f.name === file.name) || additions.some((f) => f.name === file.name)) continue;
        additions.push({ name: file.name, mimeType: /\.pdf$/i.test(file.name) ? "application/pdf" : "text/csv", base64Data: await readFileAsBase64(file), sizeLabel: formatFileSize(file.size) });
      }
      setFiles((prev) => [...prev, ...additions]);
      if (additions.length) setMaterialsError("");
    } catch {
      setFileError(textByLang(isRtl, "Could not read the file. Please try again.", "تعذّرت قراءة الملف. جرّب إرفاقه مرة أخرى."));
    } finally {
      readingFilesRef.current = false;
      setIsReadingFiles(false);
    }
  };

  const handleFilesDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFiles(true);
  };
  const handleFilesDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
  };
  const handleFilesDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    toggleFilesPicked(e.dataTransfer.files);
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const validateRequirements = async () => {
    const validFields = await form.trigger(["newProjectName", "nationalAddressCode", "description"], { shouldFocus: true });
    const data = form.getValues();
    const hasLocation = !!data.city || !!data.nationalAddressCode;
    if (!hasLocation) form.setError("city", { message: "required" });
    else form.clearErrors("city");
    let message = "";
    if (!files.length && (data.description?.trim().length || 0) < 5) message = textByLang(isRtl, "Attach a file or describe your request in at least 5 characters.", "أرفق ملفاً أو اكتب طلبك في 5 أحرف على الأقل.");
    setMaterialsError(message);
    return validFields && hasLocation && !message && !readingFilesRef.current;
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => form.handleSubmit(async (data) => {
    if (isLoading || readingFilesRef.current) return;
    if (!(await validateRequirements())) { return; }
    const projectName = data.newProjectName.trim();
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setSubmitError(textByLang(isRtl, "Please complete the security check below", "يرجى إكمال التحقق الأمني أدناه"));
      return;
    }

    // Preserve the intake API contract: the selected city is sent as address notes.
    const combinedDescription = data.description?.trim() || "";
    const combinedAddressNotes = data.city ? optionLabel(isRtl, saudiCities, data.city) : "";

    setSubmitError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/quotes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: data.contactName.trim(),
          company_name: data.companyName?.trim() || undefined,
          email: data.email.trim().toLowerCase(),
          phone: normalizeVendorPhone(data.phone),
          project_name: projectName,
          description: combinedDescription,
          national_address_code: data.nationalAddressCode || undefined,
          delivery_address_notes: combinedAddressNotes || undefined,
          files: files.map((f) => ({ name: f.name, mimeType: f.mimeType, base64Data: f.base64Data })),
          privacy_accepted: data.privacyAccepted,
          submission_id: submissionId,
          turnstile_token: turnstileToken,
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string; tracking_number?: string } | null;
      if (res.status === 202) throw new Error(textByLang(isRtl, "Your request is still being processed. Retry in a moment.", "طلبك قيد المعالجة. حاول مجدداً بعد لحظات."));
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال الطلب");
      setTrackingNumber(result?.tracking_number || "");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : textByLang(isRtl, "Something went wrong.", "حدث خطأ."));
    } finally {
      setIsLoading(false);
    }
  })(event);

  if (isSubmitted) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-primary to-emerald-700 p-8 text-center text-white shadow-lg md:p-12">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -start-20 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 animate-success-ring rounded-full bg-white/30" />
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-primary shadow-xl animate-success-pop">
            <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
          </span>
        </div>

        <h2 className="relative mt-6 text-3xl font-bold leading-tight md:text-4xl">
          {textByLang(isRtl, "We've received your request!", "استلمنا طلبك!")}
        </h2>
        <p className="relative mt-3 text-base leading-7 text-white/90 md:text-lg">
          {textByLang(
            isRtl,
            "Our team will review your materials list and follow up with pricing within 24 hours.",
            "فريقنا يراجع قائمة المواد ويتواصل معك بالأسعار خلال 24 ساعة."
          )}
        </p>

        {trackingNumber && (
          <div className="relative mx-auto mt-7 max-w-md rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {textByLang(isRtl, "Reference Number", "الرقم المرجعي")}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-widest text-white md:text-3xl" dir="ltr">{trackingNumber}</p>
            <p className="mt-2 text-xs text-white/70">
              {textByLang(isRtl, "Save this number to follow up on your request.", "احتفظ بهذا الرقم لمتابعة طلبك.")}
            </p>
          </div>
        )}

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={isRtl ? "/ar/track-request" : "/track-request"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-semibold text-brand-primary shadow-sm transition hover:bg-brand-light"
          >
            {textByLang(isRtl, "Track this request", "تتبّع هذا الطلب")}
          </a>
          <a
            href={isRtl ? "/ar/get-quote" : "/get-quote"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            {textByLang(isRtl, "Submit another request", "أرسل طلباً آخر")}
          </a>
        </div>
      </section>
    );
  }

  const t = (en: string, ar: string) => textByLang(isRtl, en, ar);
  const fieldClass = "h-14 rounded-2xl text-base";
  const materialModes = [
    { value: "text" as const, label: t("Write details instead", "اكتب التفاصيل بدلًا من الملف"), icon: MessageSquare },
  ];
  const required = <span className="ms-1 text-red-500" aria-hidden="true">*</span>;

  return (
    <div className="mx-auto w-full" dir={isRtl ? "rtl" : "ltr"}>
      <form noValidate onSubmit={onSubmit} className="min-w-0 space-y-8 overflow-hidden bg-white">

        {/* 1. File drop hero */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-brand-dark">{t("Send us your materials list", "أرسل لنا قائمة المواد")}</h3>
            {required}
          </div>
          <div hidden={materialMode !== "file"}>
            <label onDragOver={handleFilesDragOver} onDragLeave={handleFilesDragLeave} onDrop={handleFilesDrop} className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-colors focus-within:ring-2 focus-within:ring-brand-primary ${isDraggingFiles ? "border-brand-primary bg-brand-primary/10" : "border-brand-dark/20 bg-brand-light/40 hover:border-brand-primary hover:bg-brand-primary/[.04]"}`}>
              <input type="file" aria-label={t("Attach material files", "إرفاق ملفات المواد")} multiple accept=".csv,.pdf" disabled={isReadingFiles} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => { void toggleFilesPicked(e.target.files); e.target.value = ""; }} />
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-primary shadow-sm">{isReadingFiles ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}</span>
              <span className="text-base font-bold text-brand-dark">{isReadingFiles ? t("Preparing your files…", "جارٍ تجهيز الملفات…") : t("Drop your BOQ or material list here", "اسقط جدول الكميات أو قائمة المواد هنا")}</span>
              <span className="mt-1 text-sm text-brand-dark/60">{t("or click to choose a file", "أو اضغط لاختيار ملف")}</span>
              <span className="mt-3 text-xs leading-6 text-brand-dark/50">{t("PDF or CSV · up to 5 files · 8 MB each", "PDF أو CSV · حتى 5 ملفات · 8 ميجابايت للملف")}</span>
            </label>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-brand-dark/55">
              <span>{t("No file?", "ما عندك ملف؟")}</span>
              {materialModes.map((mode) => (
                <button key={mode.value} type="button" onClick={() => setMaterialMode(mode.value)} aria-pressed={materialMode === mode.value} className={`inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 transition hover:text-brand-primary ${materialMode === mode.value ? "text-brand-primary" : "text-brand-dark/70"}`}>
                  <mode.icon className="h-3.5 w-3.5" aria-hidden="true" />{mode.label}
                </button>
              ))}
            </div>
          </div>
          <div hidden={materialMode !== "text"}>
            <label htmlFor="quote-description" className="sr-only">{t("Materials description", "وصف المواد المطلوبة")}</label>
            <textarea id="quote-description" {...form.register("description")} maxLength={200} rows={3} className="w-full rounded-2xl border border-brand-dark/15 p-4 text-base leading-7 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" placeholder={t("e.g. 100 bags cement + 2 tonnes 12mm rebar", "مثال: 100 كيس أسمنت + 2 طن حديد 12 مم")} />
            <div className="mt-2 flex justify-between gap-2 text-xs text-brand-dark/55">
              <span>{t("One line is enough.", "جملة واحدة تكفي.")}</span>
              <span>{values.description?.length || 0} / 200</span>
            </div>
            <button type="button" onClick={() => setMaterialMode("file")} className="mt-3 text-xs font-semibold text-brand-primary underline">{t("← Back to file upload", "→ رجوع لرفع الملف")}</button>
          </div>
          {fileError && <p role="alert" className="mt-2 text-sm text-red-600">{fileError}</p>}
          {files.length > 0 && (
            <ul aria-label={t("Attached files", "الملفات المرفقة")} className="mt-3 space-y-2">
              {files.map((file) => (
                <li key={file.name} className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3 py-2">
                  <FileText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm" dir="auto">{file.name}<span className="ms-2 text-xs text-brand-dark/50">{file.sizeLabel}</span></span>
                  <button type="button" onClick={() => removeFile(file.name)} aria-label={`${t("Remove", "حذف")} ${file.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-dark/60 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          {materialsError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-600">{materialsError}</p>}
        </section>

        {/* 2. Project location */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-brand-dark">{t("Where is your project?", "وين مشروعك؟")}</h3>
            {required}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <QuoteField id="quote-project" label={<>{t("Project name", "اسم المشروع")}{required}</>}><Input id="quote-project" {...form.register("newProjectName")} aria-invalid={!!form.formState.errors.newProjectName} className={fieldClass} placeholder={t("e.g. Al Yasmin villa", "مثال: فيلا حي الياسمين")} /><VendorErrorText text={form.formState.errors.newProjectName?.message} isRtl={isRtl} /></QuoteField>
            <QuoteField id="quote-city" label={<>{t("Delivery city", "مدينة التسليم")}{required}</>}><select id="quote-city" {...form.register("city", { onChange: () => form.clearErrors("city") })} aria-invalid={!!form.formState.errors.city} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">{t("Choose the city", "اختر المدينة")}</option>{saudiCities.map((c) => <option key={c.value} value={c.value}>{optionLabel(isRtl, saudiCities, c.value)}</option>)}</select><VendorErrorText text={form.formState.errors.city?.message} isRtl={isRtl} /></QuoteField>
          </div>
          <details className="mt-3" open={form.formState.errors.nationalAddressCode ? true : undefined}>
            <summary className="cursor-pointer text-xs font-medium text-brand-dark/60">{t("Use national address code instead (optional)", "أو استخدم رمز العنوان الوطني (اختياري)")}</summary>
            <div className="mt-3 max-w-sm"><QuoteField id="quote-address" label={t("Short address code", "رمز العنوان المختصر")}><Input id="quote-address" {...form.register("nationalAddressCode", { setValueAs: (v: string) => v.trim().toUpperCase() })} className={`${fieldClass} uppercase`} dir="ltr" maxLength={8} placeholder="RRRD2929" /><VendorErrorText text={form.formState.errors.nationalAddressCode?.message} isRtl={isRtl} /></QuoteField><p className="mt-2 text-xs text-brand-dark/55">{t("4 letters + 4 digits.", "4 أحرف ثم 4 أرقام.")}</p></div>
          </details>
        </section>

        {/* 3. Contact details */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-brand-dark">{t("How can we reach you?", "كيف نتواصل معك؟")}</h3>
            {required}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <QuoteField id="quote-name" label={<>{t("Your name", "اسمك")}{required}</>}><Input id="quote-name" {...form.register("contactName")} autoComplete="name" aria-invalid={!!form.formState.errors.contactName} className={fieldClass} placeholder={t("Full name", "الاسم الكامل")} /><VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} /></QuoteField>
            <QuoteField id="quote-phone" label={<>{t("Mobile number", "رقم الجوال")}{required}</>}><Input id="quote-phone" {...form.register("phone")} type="tel" autoComplete="tel" dir="ltr" aria-invalid={!!form.formState.errors.phone} className={fieldClass} placeholder="05XXXXXXXX" /><VendorErrorText text={form.formState.errors.phone?.message} isRtl={isRtl} /></QuoteField>
          </div>
          <div className="mt-5">
            <QuoteField id="quote-email" label={<>{t("Email", "البريد الإلكتروني")}{required}</>}><Input id="quote-email" type="email" {...form.register("email")} autoComplete="email" dir="ltr" aria-invalid={!!form.formState.errors.email} className={fieldClass} placeholder="name@example.com" /><VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} /></QuoteField>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-brand-dark/60">{t("Add company name (optional)", "إضافة اسم المنشأة (اختياري)")}</summary>
            <div className="mt-3"><QuoteField id="quote-company" label={t("Company name", "اسم المنشأة")}><Input id="quote-company" {...form.register("companyName")} autoComplete="organization" className={fieldClass} placeholder={t("e.g. Al Majd Contracting", "مثال: شركة المجد للمقاولات")} /></QuoteField></div>
          </details>
        </section>

        {/* Submit */}
        <section className="border-t border-brand-dark/10 pt-6">
          {submitError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
          <div>
            <label className="flex cursor-pointer items-start gap-3 py-2 text-sm leading-6 text-brand-dark/80">
              <Checkbox checked={values.privacyAccepted} onCheckedChange={(v) => form.setValue("privacyAccepted", (v === true) as true, { shouldValidate: true })} />
              <span>{isRtl ? "أوافق على " : "I agree to the "}<a href={isRtl ? "/ar/privacy-policy" : "/privacy-policy"} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-brand-primary">{t("Privacy Policy", "سياسة الخصوصية")}</a>{required}</span>
            </label>
            <VendorErrorText text={form.formState.errors.privacyAccepted?.message} isRtl={isRtl} />
          </div>
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <div className="mt-3"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /><div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onQuoteTurnstileVerified" data-expired-callback="onQuoteTurnstileExpired" data-error-callback="onQuoteTurnstileExpired" data-language={isRtl ? "ar" : "en"} data-size="flexible" /></div>}
          <Button
            type="submit"
            disabled={isLoading || isReadingFiles}
            onClick={() => setFlyKey((k) => k + 1)}
            className="mt-5 h-14 w-full gap-3 rounded-2xl bg-brand-primary px-7 text-base hover:bg-brand-dark sm:w-auto sm:min-w-60"
          >
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("Sending your request…", "جارٍ إرسال طلبك…")}</> : <>{t("Send quote request", "إرسال طلب عرض السعر")}<Send key={flyKey} className={`h-4 w-4 rtl:rotate-180 ${isRtl ? "animate-send-fly-rtl" : "animate-send-fly"}`} /></>}
          </Button>
          <p className="mt-3 text-xs leading-6 text-brand-dark/50">{t("We'll review your request and follow up with pricing within 24 hours.", "نراجع طلبك خلال 24 ساعة ونرجع لك بالأسعار.")}</p>
        </section>
      </form>
    </div>
  );
}

function QuoteField({ id, label, children, className = "" }: { id: string; label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-2 ${className}`}><label htmlFor={id} className="block text-sm font-semibold text-brand-dark/85">{label}</label>{children}</div>;
}
