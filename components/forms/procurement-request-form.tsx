"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, ListPlus, Loader2, MapPin, MessageSquare, Plus, Upload, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  isEnglishBrandName,
  isValidVendorPhone,
  normalizeVendorPhone,
  optionLabel,
  saudiCities,
  supplierCountries,
  textByLang,
} from "@/lib/vendor-options";
import { VendorErrorText } from "@/components/forms/vendor-form-shared";

type PickedFile = { name: string; mimeType: string; base64Data: string; sizeLabel: string };
type ItemRow = { itemName: string; quantity: string; unit: string; brand: string; countryOfOrigin: string };

const MAX_FILES = 5;
const NATIONAL_ADDRESS_PATTERN = /^[A-Za-z]{4}\d{4}$/;

const formSchema = z.object({
  email: z.string().trim().email("invalidEmail"),
  contactName: z.string().trim().min(2, "required"),
  companyName: z.string().optional(),
  phone: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  newProjectName: z.string().trim().min(2, "required"),
  description: z.string().max(2000).optional(),
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
  const [step, setStep] = useState(0);
  const [materialMode, setMaterialMode] = useState<"file" | "text" | "items">("file");
  const [materialsError, setMaterialsError] = useState("");
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const readingFilesRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

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

  const addItemRow = () => setItems((prev) => [...prev, { itemName: "", quantity: "", unit: "", brand: "", countryOfOrigin: "" }]);
  const updateItemRow = (index: number, patch: Partial<ItemRow>) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

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

  const focusStep = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  };

  const validateRequirements = async () => {
    const validFields = await form.trigger(["newProjectName", "nationalAddressCode", "description"], { shouldFocus: true });
    const data = form.getValues();
    const hasLocation = !!data.city || !!data.nationalAddressCode;
    if (!hasLocation) form.setError("city", { message: "required" });
    else form.clearErrors("city");
    const partialItem = items.some((it) => !it.itemName.trim() || !Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0);
    const invalidBrand = items.some((it) => it.brand.trim() && !isEnglishBrandName(it.brand));
    let message = "";
    if (partialItem) message = textByLang(isRtl, "Enter a name and a quantity greater than zero for each item, or remove the empty row.", "أكمل اسم وكمية كل صنف، أو احذف الصف الفارغ. الكمية يجب أن تكون أكبر من صفر.");
    else if (invalidBrand) message = textByLang(isRtl, "Enter brand names in English only.", "اكتب أسماء العلامات التجارية بالإنجليزي فقط.");
    else if (!files.length && !items.length && (data.description?.trim().length || 0) < 5) message = textByLang(isRtl, "Attach a file, add items, or describe your requirements in at least 5 characters.", "أرفق ملفاً، أو أضف أصنافاً، أو اكتب احتياجاتك في 5 أحرف على الأقل.");
    setMaterialsError(message);
    return validFields && hasLocation && !message && !readingFilesRef.current;
  };

  const continueToContact = async () => {
    setSubmitError("");
    if (await validateRequirements()) focusStep(1);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => form.handleSubmit(async (data) => {
    if (isLoading || readingFilesRef.current) return;
    if (!(await validateRequirements())) { focusStep(0); return; }
    const projectName = data.newProjectName.trim();
    const validItems = items;
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
          items: validItems.map((it) => ({
            itemName: it.itemName.trim(),
            quantity: Number(it.quantity),
            unit: it.unit.trim() || undefined,
            brand: it.brand.trim() || undefined,
            countryOfOrigin: it.countryOfOrigin ? optionLabel(isRtl, supplierCountries, it.countryOfOrigin) : undefined,
          })),
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
  }, (errors) => {
    if (errors.newProjectName || errors.nationalAddressCode || errors.description) focusStep(0);
  })(event);

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-brand-primary/20 bg-white p-8 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="type-section-title mx-auto mt-5 text-brand-dark">
          {textByLang(isRtl, "Request Received", "تم استلام طلبكم")}
        </h2>
        <p className="mt-3 text-brand-dark/75">
          {textByLang(
            isRtl,
            "Our team will review your request and follow up with pricing shortly.",
            "سيراجع فريقنا طلبكم ويتابع معكم بالأسعار قريباً."
          )}
        </p>
        {trackingNumber && (
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
            <p className="text-xs font-semibold text-brand-dark/50">{textByLang(isRtl, "Reference Number", "الرقم المرجعي")}</p>
            <p className="mt-1 text-lg font-bold tracking-wide text-brand-primary" dir="ltr">{trackingNumber}</p>
          </div>
        )}
      </section>
    );
  }

  const t = (en: string, ar: string) => textByLang(isRtl, en, ar);
  const Forward = isRtl ? ArrowLeft : ArrowRight;
  const Back = isRtl ? ArrowRight : ArrowLeft;
  const fieldClass = "h-12 rounded-lg text-base";
  const materialModes = [
    { value: "file" as const, label: t("Attach a file", "أرفق ملفاً"), icon: Upload },
    { value: "text" as const, label: t("Write your request", "اكتب طلبك"), icon: MessageSquare },
    { value: "items" as const, label: t("Add items", "أضف أصنافاً"), icon: ListPlus },
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" dir={isRtl ? "rtl" : "ltr"}>
      <form noValidate onSubmit={(e) => { if (step === 0) { e.preventDefault(); void continueToContact(); } else { void onSubmit(e); } }} className="min-w-0 overflow-hidden rounded-xl border border-brand-dark/10 bg-white">
        <nav aria-label={t("Request steps", "خطوات الطلب")} className="grid grid-cols-2 border-b border-brand-dark/10">
          {[t("Your project needs", "احتياجات مشروعك"), t("Contact & send", "التواصل والإرسال")].map((label, i) => (
            <button key={label} type="button" disabled={isLoading} onClick={() => i === 0 ? focusStep(0) : void continueToContact()} aria-current={step === i ? "step" : undefined} className={`flex min-h-20 items-center justify-center gap-3 border-b-2 px-3 py-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-primary ${step === i ? "border-brand-primary bg-brand-primary/[.04] text-brand-dark" : "border-transparent text-brand-dark/50 hover:text-brand-dark"}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${step >= i ? "bg-brand-dark text-white" : "border border-brand-dark/20"}`}>{step > i ? <Check className="h-4 w-4" aria-hidden="true" /> : `0${i + 1}`}</span>
              {label}
            </button>
          ))}
        </nav>

        <fieldset disabled={isLoading} className="min-w-0 p-5 sm:p-8">
          <legend className="sr-only">{t("Quote request", "طلب عرض سعر")}</legend>
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold text-brand-primary">{step === 0 ? t("STEP 01 OF 02", "الخطوة 01 من 02") : t("STEP 02 OF 02", "الخطوة 02 من 02")}</p>
            <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-2xl font-bold text-brand-dark outline-none">{step === 0 ? t("Let’s start with the materials", "نبدأ بالمواد المطلوبة") : t("How can we reach you?", "كيف نتواصل معك؟")}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-dark/60">{step === 0 ? t("Choose the easiest way for you. One method is enough.", "اختر الطريقة الأسهل لك. طريقة واحدة تكفي.") : t("We’ll use these details to follow up on your request and quote.", "نستخدم هذه البيانات لمتابعة طلبك والتواصل بشأن عرض السعر.")}</p>
          </div>

          <div hidden={step !== 0}>
            <div className="mb-4 grid grid-cols-3 gap-2" aria-label={t("How to add materials", "طريقة إضافة المواد")}>
              {materialModes.map((mode) => (
                <button key={mode.value} type="button" onClick={() => setMaterialMode(mode.value)} aria-pressed={materialMode === mode.value} className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-lg border px-1 py-3 text-xs font-semibold transition sm:flex-row sm:gap-2 sm:text-sm ${materialMode === mode.value ? "border-brand-dark bg-brand-dark text-white" : "border-brand-dark/15 text-brand-dark/65 hover:border-brand-dark/40"}`}>
                  <mode.icon className={`h-4 w-4 ${materialMode === mode.value ? "text-brand-accent" : ""}`} aria-hidden="true" />{mode.label}
                </button>
              ))}
            </div>

            <div hidden={materialMode !== "file"}>
              <label onDragOver={handleFilesDragOver} onDragLeave={handleFilesDragLeave} onDrop={handleFilesDrop} className={`relative flex min-h-[192px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition-colors focus-within:ring-2 focus-within:ring-brand-primary ${isDraggingFiles ? "border-brand-primary bg-brand-primary/10" : "border-brand-dark/25 bg-brand-light/50 hover:border-brand-primary"}`}>
                <input type="file" aria-label={t("Attach material files", "إرفاق ملفات المواد")} multiple accept=".csv,.pdf" disabled={isReadingFiles} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => { void toggleFilesPicked(e.target.files); e.target.value = ""; }} />
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-primary">{isReadingFiles ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</span>
                <span className="text-sm font-bold text-brand-dark">{isReadingFiles ? t("Preparing your files…", "جارٍ تجهيز الملفات…") : t("Choose your BOQ or drop it here", "اختر جدول الكميات أو اسحبه هنا")}</span>
                <span className="mt-2 text-xs leading-6 text-brand-dark/55">{t("PDF or CSV · Up to 5 files · 8 MB per file", "PDF أو CSV · حتى 5 ملفات · 8 ميجابايت للملف")}</span>
              </label>
              <p className="mt-2 text-xs leading-6 text-brand-dark/55">{t("Have an Excel sheet? Save it as CSV before uploading.", "ملفك إكسل؟ احفظه بصيغة CSV ثم أرفقه.")}</p>
            </div>
            {fileError && <p role="alert" className="mt-2 text-sm text-red-600">{fileError}</p>}
            {files.length > 0 && (
              <ul aria-label={t("Attached files", "الملفات المرفقة")} className="my-3 space-y-2">
                {files.map((file) => <li key={file.name} className="flex items-center gap-3 rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-3 py-2">
                  <FileText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm" dir="auto">{file.name}<span className="ms-2 text-xs text-brand-dark/50">{file.sizeLabel}</span></span>
                  <button type="button" onClick={() => removeFile(file.name)} aria-label={`${t("Remove", "حذف")} ${file.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-dark/60 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                </li>)}
              </ul>
            )}
            <div hidden={materialMode !== "text"}>
              <label htmlFor="quote-description" className="sr-only">{t("Materials description", "وصف المواد المطلوبة")}</label>
              <textarea id="quote-description" {...form.register("description")} maxLength={2000} className="min-h-[192px] w-full rounded-xl border border-brand-dark/20 p-4 text-base leading-7 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" placeholder={t("For example: 100 bags of cement and 2 tonnes of 12 mm rebar. Add quantities and specifications if available.", "مثال: أحتاج 100 كيس أسمنت و2 طن حديد تسليح مقاس 12 مم. اذكر الكميات والمواصفات إن توفرت.")} />
              <p className="mt-2 flex justify-between gap-2 text-xs text-brand-dark/55"><span>{t("You can also paste a list from Excel.", "تقدر تلصق قائمة المواد مباشرة من إكسل.")}</span><span>{values.description?.length || 0} / 2000</span></p>
            </div>
            {materialMode !== "text" && values.description?.trim() && <p className="mt-3 rounded-lg bg-brand-light p-3 text-sm text-brand-dark/65">{t("Written request saved", "تم حفظ وصف طلبك")} <button type="button" onClick={() => setMaterialMode("text")} className="ms-2 font-semibold underline">{t("Edit", "تعديل")}</button></p>}

            <div hidden={materialMode !== "items"} className="space-y-3">
              {items.length === 0 && <p className="rounded-lg bg-brand-light/60 px-4 py-5 text-sm leading-6 text-brand-dark/60">{t("Add the item name and quantity. You can leave other specifications blank.", "أضف اسم الصنف والكمية. باقي المواصفات اختيارية.")}</p>}
              {items.map((item, i) => (
                <div key={i} className="rounded-xl border border-brand-dark/15 p-4">
                  <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-brand-dark/55">{t("ITEM", "الصنف")} {i + 1}</span><button type="button" onClick={() => removeItemRow(i)} aria-label={`${t("Remove item", "حذف الصنف")} ${i + 1}`} className="flex h-8 w-8 items-center justify-center rounded-full text-brand-dark/50 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_100px_100px]">
                    <QuoteField id={`item-${i}`} label={t("Item name", "اسم الصنف")} className="col-span-2 sm:col-span-1"><Input id={`item-${i}`} maxLength={200} value={item.itemName} onChange={(e) => updateItemRow(i, { itemName: e.target.value })} placeholder={t("e.g. Portland cement", "مثال: أسمنت بورتلاندي")} className={fieldClass} /></QuoteField>
                    <QuoteField id={`qty-${i}`} label={t("Quantity", "الكمية")}><Input id={`qty-${i}`} value={item.quantity} onChange={(e) => updateItemRow(i, { quantity: e.target.value })} type="number" min="0.001" step="any" placeholder="100" className={fieldClass} /></QuoteField>
                    <QuoteField id={`unit-${i}`} label={t("Unit (optional)", "الوحدة (اختياري)")}><Input id={`unit-${i}`} maxLength={30} value={item.unit} onChange={(e) => updateItemRow(i, { unit: e.target.value })} placeholder={t("bag", "كيس")} className={fieldClass} /></QuoteField>
                  </div>
                  <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-brand-dark/60">{t("Brand & country of origin (optional)", "العلامة التجارية وبلد المنشأ (اختياري)")}</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <QuoteField id={`brand-${i}`} label={t("Brand in English", "العلامة بالإنجليزي")}><Input id={`brand-${i}`} maxLength={100} value={item.brand} onChange={(e) => updateItemRow(i, { brand: e.target.value })} className={fieldClass} dir="ltr" /></QuoteField>
                    <QuoteField id={`origin-${i}`} label={t("Country of origin", "بلد المنشأ")}><select id={`origin-${i}`} value={item.countryOfOrigin} onChange={(e) => updateItemRow(i, { countryOfOrigin: e.target.value })} className="h-12 w-full rounded-lg border border-brand-dark/20 bg-white px-3 text-sm"><option value="">{t("No preference", "غير محدد")}</option>{supplierCountries.map((c) => <option key={c.value} value={c.value}>{optionLabel(isRtl, supplierCountries, c.value)}</option>)}</select></QuoteField>
                  </div></details>
                </div>
              ))}
              <button type="button" disabled={items.length >= 50} onClick={addItemRow} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-dark/25 text-sm font-semibold text-brand-dark hover:border-brand-primary hover:bg-brand-primary/5 disabled:opacity-50"><Plus className="h-4 w-4" />{items.length >= 50 ? t("50 item limit reached", "وصلت للحد الأقصى: 50 صنفاً") : t("Add an item", "إضافة صنف")}</button>
            </div>
            {materialMode !== "items" && items.length > 0 && <p className="mt-3 text-sm text-brand-dark/65">{t("Items added", "الأصناف المضافة")}: {items.length} <button type="button" onClick={() => setMaterialMode("items")} className="ms-2 font-semibold underline">{t("Edit", "تعديل")}</button></p>}
            {materialsError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-600">{materialsError}</p>}

            <div className="my-7 border-t border-brand-dark/10" />
            <div className="mb-5 flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-primary" aria-hidden="true" /><h3 className="text-base font-bold">{t("Where is your project?", "وين مشروعك؟")}</h3></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <QuoteField id="quote-project" label={t("Project name", "اسم المشروع")}><Input id="quote-project" {...form.register("newProjectName")} aria-invalid={!!form.formState.errors.newProjectName} className={fieldClass} placeholder={t("e.g. Al Yasmin villa", "مثال: فيلا حي الياسمين")} /><VendorErrorText text={form.formState.errors.newProjectName?.message} isRtl={isRtl} /></QuoteField>
              <QuoteField id="quote-city" label={t("Delivery city", "مدينة التسليم")}><select id="quote-city" {...form.register("city", { onChange: () => form.clearErrors("city") })} aria-invalid={!!form.formState.errors.city} className="h-12 w-full rounded-lg border border-brand-dark/20 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">{t("Choose the city", "اختر المدينة")}</option>{saudiCities.map((c) => <option key={c.value} value={c.value}>{optionLabel(isRtl, saudiCities, c.value)}</option>)}</select><VendorErrorText text={form.formState.errors.city?.message} isRtl={isRtl} /></QuoteField>
            </div>
            <details className="mt-5" open={form.formState.errors.nationalAddressCode ? true : undefined}>
              <summary className="cursor-pointer text-sm font-medium text-brand-dark/65">{t("Add national address (optional)", "إضافة العنوان الوطني (اختياري)")}</summary>
              <div className="mt-3 max-w-sm"><QuoteField id="quote-address" label={t("Short address code", "رمز العنوان المختصر")}><Input id="quote-address" {...form.register("nationalAddressCode", { setValueAs: (v: string) => v.trim().toUpperCase() })} className={`${fieldClass} uppercase`} dir="ltr" maxLength={8} placeholder="RRRD2929" /><VendorErrorText text={form.formState.errors.nationalAddressCode?.message} isRtl={isRtl} /></QuoteField><p className="mt-2 text-xs text-brand-dark/55">{t("4 letters and 4 digits. You may use this instead of a city.", "4 أحرف ثم 4 أرقام. يمكنك استخدامه بدلاً من اختيار المدينة.")}</p></div>
            </details>
          </div>

          <div hidden={step !== 1} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <QuoteField id="quote-name" label={t("Your name", "اسمك")}><Input id="quote-name" {...form.register("contactName")} autoComplete="name" aria-invalid={!!form.formState.errors.contactName} className={fieldClass} placeholder={t("Full name", "الاسم الكامل")} /><VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} /></QuoteField>
              <QuoteField id="quote-phone" label={t("Mobile number", "رقم الجوال")}><Input id="quote-phone" {...form.register("phone")} type="tel" autoComplete="tel" dir="ltr" aria-invalid={!!form.formState.errors.phone} className={fieldClass} placeholder="05XXXXXXXX" /><VendorErrorText text={form.formState.errors.phone?.message} isRtl={isRtl} /></QuoteField>
            </div>
            <QuoteField id="quote-email" label={t("Email", "البريد الإلكتروني")}><Input id="quote-email" type="email" {...form.register("email")} autoComplete="email" dir="ltr" aria-invalid={!!form.formState.errors.email} className={fieldClass} placeholder="name@example.com" /><VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} /></QuoteField>
            <QuoteField id="quote-company" label={t("Company name (optional)", "اسم المنشأة (اختياري)")}><Input id="quote-company" {...form.register("companyName")} autoComplete="organization" className={fieldClass} placeholder={t("Leave blank for a personal project", "اتركه فارغاً إذا كان المشروع شخصياً")} /></QuoteField>
            <div className="rounded-lg bg-brand-light/70 p-4"><p className="mb-3 text-sm font-bold">{t("Review your request", "راجع طلبك")}</p><p className="break-words text-sm leading-7 text-brand-dark/70">{values.newProjectName} · {values.city ? optionLabel(isRtl, saudiCities, values.city) : values.nationalAddressCode}</p><p className="text-sm leading-7 text-brand-dark/70">{files.length > 0 && `${files.length} ${t("file(s)", "ملف مرفق")} · `}{items.length > 0 && `${items.length} ${t("item(s)", "صنف")} · `}{values.description?.trim() && t("Written requirements", "وصف المواد مضاف")}</p><details className="mt-2 text-sm text-brand-dark/70"><summary className="cursor-pointer text-xs font-semibold">{t("View materials & attachments", "عرض المواد والمرفقات")}</summary><div className="mt-3 space-y-2">{values.description?.trim() && <p className="whitespace-pre-wrap break-words leading-7">{values.description}</p>}{items.map((item, i) => <p key={i} className="break-words">{item.itemName} — {item.quantity} {item.unit}</p>)}{files.map((file) => <p key={file.name} className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0" /><span className="break-all" dir="auto">{file.name}</span></p>)}</div></details><button type="button" onClick={() => focusStep(0)} className="mt-2 text-xs font-semibold text-brand-dark underline">{t("Edit request details", "تعديل تفاصيل الطلب")}</button></div>
            <div>
              <label className="flex cursor-pointer items-center gap-3 py-2 text-sm leading-6 text-brand-dark/80"><Checkbox checked={values.privacyAccepted} onCheckedChange={(v) => form.setValue("privacyAccepted", (v === true) as true, { shouldValidate: true })} /><span>{isRtl ? "أوافق على " : "I agree to the "}<a href={isRtl ? "/ar/privacy-policy" : "/privacy-policy"} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-brand-primary">{t("Privacy Policy", "سياسة الخصوصية")}</a></span></label><VendorErrorText text={form.formState.errors.privacyAccepted?.message} isRtl={isRtl} />
            </div>
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <div><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /><div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onQuoteTurnstileVerified" data-expired-callback="onQuoteTurnstileExpired" data-error-callback="onQuoteTurnstileExpired" data-language={isRtl ? "ar" : "en"} data-size="flexible" /></div>}
          </div>

          <div className="mt-7 border-t border-brand-dark/10 pt-6">
            {submitError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              {step === 0 ? <p className="text-center text-xs text-brand-dark/55 sm:text-start">{t("Next: your contact details", "التالي: بيانات التواصل")}</p> : <button type="button" onClick={() => focusStep(0)} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold"><Back className="h-4 w-4" />{t("Back", "رجوع")}</button>}
              <Button type="submit" disabled={isLoading || isReadingFiles} className="h-12 gap-3 rounded-lg px-7 text-sm sm:min-w-52">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("Sending your request…", "جارٍ إرسال طلبك…")}</> : <>{step === 0 ? t("Continue to contact details", "متابعة لبيانات التواصل") : t("Send quote request", "إرسال طلب عرض السعر")}<Forward className="h-4 w-4" /></>}</Button>
            </div>
            {step === 1 && <p className="mt-4 text-center text-xs leading-6 text-brand-dark/50">{t("Our team will review the request and contact you about pricing.", "بعد الإرسال، يراجع فريقنا الطلب ويتواصل معك بشأن الأسعار.")}</p>}
          </div>
        </fieldset>
      </form>

      <aside aria-label={t("Your request at a glance", "طلبك باختصار")} className="hidden space-y-4 lg:sticky lg:top-28 lg:block">
        <div className="overflow-hidden rounded-xl bg-brand-dark p-6 text-white">
          <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20"><FileText className="h-5 w-5 text-brand-accent" aria-hidden="true" /></span>
          <h2 className="text-lg font-bold">{t("One request. A clear next step.", "طلب واحد، وخطوة واضحة.")}</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">{t("Share what you need. We’ll review the materials and quantities, then follow up with your quote.", "أرسل احتياجاتك. نراجع المواد والكميات، ونتابع معك لتجهيز عرض السعر.")}</p>
          <ol className="mt-6 space-y-4 border-t border-white/15 pt-5">{[t("Share your requirements", "أضف احتياجاتك"), t("We review the details", "نراجع التفاصيل"), t("Receive your quote", "يصلك عرض السعر")].map((label, i) => <li key={label} className="flex items-center gap-3 text-sm"><span className="text-xs tabular-nums text-brand-accent">0{i + 1}</span><span className="text-white/85">{label}</span></li>)}</ol>
        </div>

      </aside>
    </div>
  );
}

function QuoteField({ id, label, children, className = "" }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-2 ${className}`}><label htmlFor={id} className="block text-sm font-semibold text-brand-dark/85">{label}</label>{children}</div>;
}
