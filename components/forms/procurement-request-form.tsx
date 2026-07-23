"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Paperclip, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { EmailVerify } from "@/components/ui/email-verify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidVendorPhone, normalizeVendorPhone, optionLabel, supplierCountries, textByLang } from "@/lib/vendor-options";
import { VendorErrorText, VendorField, VendorOptionCard, VendorPhoneInput } from "@/components/forms/vendor-form-shared";

type PickedFile = { name: string; mimeType: string; base64Data: string; sizeLabel: string };
type CustomerProject = { id: number; name: string };
type CustomerLookup = { contactName: string; companyName: string; phone: string; projects: CustomerProject[] };
type ItemRow = { itemName: string; quantity: string; unit: string; brand: string; countryOfOrigin: string };

const MAX_FILES = 5;
const NEW_PROJECT = "__new__";
const NATIONAL_ADDRESS_PATTERN = /^[A-Za-z]{4}\d{4}$/;

const formSchema = z.object({
  email: z.string().email("invalidEmail"),
  contactName: z.string().min(2, "required"),
  companyName: z.string().optional(),
  phone: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  projectChoice: z.string().optional(),
  newProjectName: z.string().optional(),
  description: z.string().optional(),
  nationalAddressCode: z
    .string()
    .optional()
    .refine((v) => !v || NATIONAL_ADDRESS_PATTERN.test(v), { message: "invalidNationalAddress" }),
  requestedDeliveryDate: z.string().optional(),
  addressNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  email: "",
  contactName: "",
  companyName: "",
  phone: "",
  projectChoice: "",
  newProjectName: "",
  description: "",
  nationalAddressCode: "",
  requestedDeliveryDate: "",
  addressNotes: "",
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [lookup, setLookup] = useState<CustomerLookup | null>(null);
  const [lookupChecked, setLookupChecked] = useState(false);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    (window as unknown as Record<string, unknown>).onQuoteTurnstileVerified = (token: string) => setTurnstileToken(token);
    return () => {
      delete (window as unknown as Record<string, unknown>).onQuoteTurnstileVerified;
    };
  }, []);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" });
  const values = form.watch();
  const emailVerified = !!verifiedEmail && verifiedEmail === values.email.trim().toLowerCase() && !!emailToken;

  const handleEmailVerified = async (token: string) => {
    setVerifiedEmail(values.email.trim().toLowerCase());
    setEmailToken(token);
    form.clearErrors("email");

    try {
      const res = await fetch("/api/quotes/lookup-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.trim().toLowerCase(), email_verified_token: token }),
      });
      const body = (await res.json().catch(() => null)) as ({ ok?: boolean; found?: boolean } & Partial<CustomerLookup>) | null;
      if (body?.ok && body.found) {
        const data: CustomerLookup = { contactName: body.contactName || "", companyName: body.companyName || "", phone: body.phone || "", projects: body.projects || [] };
        setLookup(data);
        form.setValue("contactName", data.contactName);
        form.setValue("companyName", data.companyName);
        form.setValue("phone", data.phone);
        if (data.projects.length) form.setValue("projectChoice", String(data.projects[0].id));
      }
    } catch {
      // فشل البحث لا يوقف الفورم — تكملة الإدخال يدوياً
    } finally {
      setLookupChecked(true);
    }
  };

  const deleteProject = async (projectId: number) => {
    if (!lookup) return;
    try {
      await fetch("/api/quotes/delete-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, email: verifiedEmail, email_verified_token: emailToken }),
      });
      const nextProjects = lookup.projects.filter((p) => p.id !== projectId);
      setLookup({ ...lookup, projects: nextProjects });
      if (values.projectChoice === String(projectId)) {
        form.setValue("projectChoice", nextProjects.length ? String(nextProjects[0].id) : NEW_PROJECT);
      }
    } catch {
      setSubmitError(textByLang(isRtl, "Could not delete the project. Try again.", "تعذر حذف المشروع. حاول مجدداً."));
    }
  };

  const addItemRow = () => setItems((prev) => [...prev, { itemName: "", quantity: "", unit: "", brand: "", countryOfOrigin: "" }]);
  const updateItemRow = (index: number, patch: Partial<ItemRow>) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const toggleFilesPicked = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setFileError("");
    const picked = Array.from(fileList);
    if (files.length + picked.length > MAX_FILES) {
      setFileError(textByLang(isRtl, `You can attach up to ${MAX_FILES} files`, `يمكن إرفاق ${MAX_FILES} ملفات كحد أقصى`));
      return;
    }
    for (const file of picked) {
      if (file.size > 8 * 1024 * 1024) {
        setFileError(textByLang(isRtl, "Each file must be under 8MB", "كل ملف يجب ألا يتجاوز 8 ميجابايت"));
        continue;
      }
      const base64Data = await readFileAsBase64(file);
      setFiles((prev) => [...prev, { name: file.name, mimeType: file.type || "application/octet-stream", base64Data, sizeLabel: formatFileSize(file.size) }]);
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

  const onSubmit = form.handleSubmit(async (data) => {
    if (!emailVerified) {
      form.setError("email", { message: "required" });
      setSubmitError(textByLang(isRtl, "Please verify your email first", "يجب التحقق من البريد الإلكتروني أولاً"));
      return;
    }

    const hasExistingProjects = !!lookup && lookup.projects.length > 0;
    const projectName = hasExistingProjects
      ? data.projectChoice === NEW_PROJECT
        ? data.newProjectName?.trim() || ""
        : lookup!.projects.find((p) => String(p.id) === data.projectChoice)?.name || ""
      : data.newProjectName?.trim() || "";
    if (!projectName) {
      form.setError("newProjectName", { message: "required" });
      setSubmitError(textByLang(isRtl, "Please name your project", "يرجى كتابة اسم المشروع"));
      return;
    }

    const validItems = items.filter((it) => it.itemName.trim() && Number(it.quantity) > 0);
    const hasLocation = !!data.nationalAddressCode || !!data.addressNotes?.trim();
    if (!hasLocation) {
      setSubmitError(textByLang(isRtl, "Set the delivery location: national address code, or city/district", "حدد موقع التسليم: رمز العنوان الوطني، أو المدينة/الحي"));
      return;
    }
    const hasMaterialsInfo = !!data.description?.trim() || validItems.length > 0 || files.length > 0;
    if (!hasMaterialsInfo) {
      setSubmitError(textByLang(isRtl, "Add a description, items, or a file for the materials needed", "أضف وصفاً، أصنافاً، أو ملفاً للمواد المطلوبة"));
      return;
    }
    if (!turnstileToken) {
      setSubmitError(textByLang(isRtl, "Please complete the security check below", "يرجى إكمال التحقق الأمني أدناه"));
      return;
    }

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
          email_verified_token: emailToken,
          phone: normalizeVendorPhone(data.phone),
          project_name: projectName,
          description: data.description?.trim() || "",
          items: validItems.map((it) => ({
            itemName: it.itemName.trim(),
            quantity: Number(it.quantity),
            unit: it.unit.trim() || undefined,
            brand: it.brand.trim() || undefined,
            countryOfOrigin: it.countryOfOrigin ? optionLabel(isRtl, supplierCountries, it.countryOfOrigin) : undefined,
          })),
          national_address_code: data.nationalAddressCode || undefined,
          delivery_address_notes: data.addressNotes?.trim() || undefined,
          requested_delivery_date: data.requestedDeliveryDate || undefined,
          files: files.map((f) => ({ name: f.name, mimeType: f.mimeType, base64Data: f.base64Data })),
          turnstile_token: turnstileToken,
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string; tracking_number?: string; tracking_token?: string } | null;
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال الطلب");
      setTrackingNumber(result?.tracking_number || "");
      setTrackingToken(result?.tracking_token || "");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : textByLang(isRtl, "Something went wrong.", "حدث خطأ."));
    } finally {
      setIsLoading(false);
    }
  });

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
            <p className="text-xs font-semibold text-brand-dark/50">{textByLang(isRtl, "Tracking Number", "رقم التتبع")}</p>
            <p className="mt-1 text-lg font-bold tracking-wide text-brand-primary" dir="ltr">{trackingNumber}</p>
            <a
              href={`${isRtl ? "/ar" : ""}/track-request?token=${trackingToken}`}
              className="mt-4 inline-block rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {textByLang(isRtl, "Track Your Request", "تتبع طلبكم")}
            </a>
          </div>
        )}
      </section>
    );
  }

  const hasExistingProjects = !!lookup && lookup.projects.length > 0;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl rounded-2xl border border-brand-dark/10 bg-white p-5 md:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-6 flex items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand-dark/70 w-fit">
        <ShieldCheck className="h-4 w-4 text-brand-primary" />
        {textByLang(isRtl, "Our team reviews every request", "فريقنا يراجع كل طلب بعناية")}
      </div>

      <div className="space-y-5">
        <VendorField label={textByLang(isRtl, "Email", "البريد الإلكتروني")} helper={textByLang(isRtl, "We'll verify it first to speed up your request", "نتحقق منه أولاً لتسريع طلبك")}>
          <Input
            type="email"
            {...form.register("email", {
              onChange: () => {
                if (emailVerified) {
                  setVerifiedEmail("");
                  setEmailToken("");
                  setLookup(null);
                  setLookupChecked(false);
                }
              },
            })}
            className="h-12"
            dir="ltr"
            autoFocus
          />
          <VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} />
        </VendorField>

        {emailVerified ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {textByLang(isRtl, "Email verified ✓", "تم التحقق من البريد ✓")}
          </div>
        ) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? (
          <EmailVerify email={values.email.trim()} isRtl={isRtl} onVerified={handleEmailVerified} />
        ) : null}

        {emailVerified && !lookupChecked && (
          <div className="flex items-center gap-2 text-sm text-brand-dark/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            {textByLang(isRtl, "Checking your account…", "جاري التحقق من حسابكم…")}
          </div>
        )}

        {emailVerified && lookupChecked && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {lookup && (
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-brand-dark/80">
                {textByLang(isRtl, `Welcome back, ${lookup.contactName}! We filled in your details below.`, `مرحباً بعودتك، ${lookup.contactName}! عبّينا بياناتكم أدناه.`)}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <VendorField label={textByLang(isRtl, "Your Name", "اسمك")}>
                <Input {...form.register("contactName")} className="h-12" />
                <VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} />
              </VendorField>
              <VendorField label={textByLang(isRtl, "Company (optional)", "المنشأة (اختياري)")}>
                <Input {...form.register("companyName")} className="h-12" />
              </VendorField>
            </div>

            <VendorField label={textByLang(isRtl, "Mobile Number", "رقم الجوال")}>
              <VendorPhoneInput value={values.phone} onChange={(v) => form.setValue("phone", v, { shouldValidate: true })} isRtl={isRtl} hasError={!!form.formState.errors.phone} />
              <VendorErrorText text={form.formState.errors.phone?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Project", "المشروع")} helper={textByLang(isRtl, "Every request must belong to a project", "كل طلب يجب أن يكون مرتبطاً بمشروع")}>
              {hasExistingProjects ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lookup!.projects.map((p) => (
                      <div key={p.id} className="flex items-center gap-1">
                        <VendorOptionCard checked={values.projectChoice === String(p.id)}>
                          <input type="radio" className="h-4 w-4 accent-brand-primary" checked={values.projectChoice === String(p.id)} onChange={() => form.setValue("projectChoice", String(p.id), { shouldValidate: true })} />
                          {p.name}
                        </VendorOptionCard>
                        <button type="button" onClick={() => deleteProject(p.id)} className="shrink-0 text-brand-dark/35 hover:text-red-600" title={textByLang(isRtl, "Delete project", "حذف المشروع")}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <VendorOptionCard checked={values.projectChoice === NEW_PROJECT}>
                      <input type="radio" className="h-4 w-4 accent-brand-primary" checked={values.projectChoice === NEW_PROJECT} onChange={() => form.setValue("projectChoice", NEW_PROJECT, { shouldValidate: true })} />
                      {textByLang(isRtl, "New project", "مشروع جديد")}
                    </VendorOptionCard>
                  </div>
                  {values.projectChoice === NEW_PROJECT && (
                    <Input {...form.register("newProjectName")} className="h-12" placeholder={textByLang(isRtl, "New project name", "اسم المشروع الجديد")} />
                  )}
                </div>
              ) : (
                <Input {...form.register("newProjectName")} className="h-12" />
              )}
              <VendorErrorText text={form.formState.errors.newProjectName?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Materials Needed", "المواد المطلوبة")} helper={textByLang(isRtl, "Attach your order as an Excel or PDF file — fastest way. Or list items below.", "أرفق طلبك كملف إكسل أو PDF — أسرع طريقة. أو عدّد الأصناف أدناه.")}>
              <label
                onDragOver={handleFilesDragOver}
                onDragLeave={handleFilesDragLeave}
                onDrop={handleFilesDrop}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-6 transition-colors ${
                  isDraggingFiles ? "border-brand-primary bg-brand-primary/15" : "border-brand-primary/40 bg-brand-primary/5 hover:bg-brand-primary/10"
                }`}
              >
                <Paperclip className="h-5 w-5 text-brand-primary" />
                <input type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => toggleFilesPicked(e.target.files)} />
                <span>{textByLang(isRtl, "Choose a file, or drag and drop it here", "اختر ملفاً، أو اسحبه وأفلته هنا")}</span>
              </label>
              {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center justify-between rounded-lg bg-brand-light/50 px-3 py-2 text-sm">
                      <span className="truncate">{f.name} <span className="text-brand-dark/40">({f.sizeLabel})</span></span>
                      <button type="button" onClick={() => removeFile(f.name)} className="text-brand-dark/45 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-brand-dark/40">{textByLang(isRtl, "Or list items", "أو عدّد الأصناف")}</p>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-xl border border-brand-dark/10 p-3">
                    <div className="flex items-center gap-2">
                      <Input value={item.itemName} onChange={(e) => updateItemRow(i, { itemName: e.target.value })} placeholder={textByLang(isRtl, "Item name", "اسم الصنف")} className="h-11" />
                      <button type="button" onClick={() => removeItemRow(i)} className="shrink-0 text-brand-dark/40 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Input value={item.quantity} onChange={(e) => updateItemRow(i, { quantity: e.target.value })} type="number" min="0" placeholder={textByLang(isRtl, "Qty", "الكمية")} className="h-11" />
                      <Input value={item.unit} onChange={(e) => updateItemRow(i, { unit: e.target.value })} placeholder={textByLang(isRtl, "Unit", "الوحدة")} className="h-11" />
                      <Input value={item.brand} onChange={(e) => updateItemRow(i, { brand: e.target.value })} placeholder={textByLang(isRtl, "Brand (optional)", "العلامة التجارية (اختياري)")} className="h-11" />
                      <select
                        value={item.countryOfOrigin}
                        onChange={(e) => updateItemRow(i, { countryOfOrigin: e.target.value })}
                        className="h-11 rounded-xl border border-brand-dark/15 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="">{textByLang(isRtl, "Country of origin", "بلد المنشأ")}</option>
                        {supplierCountries.map((c) => (
                          <option key={c.value} value={c.value}>
                            {optionLabel(isRtl, supplierCountries, c.value)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addItemRow} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-dark">
                  <Plus className="h-4 w-4" />
                  {textByLang(isRtl, "Add an item", "أضف صنفاً")}
                </button>
              </div>
              <textarea
                {...form.register("description")}
                className="mt-3 min-h-[64px] w-full rounded-xl border border-brand-dark/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                placeholder={textByLang(isRtl, "Additional notes (optional)", "ملاحظات إضافية (اختياري)")}
              />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Delivery Location", "موقع التسليم")} helper={textByLang(isRtl, "Enter your national short address, or the city/district", "أدخل رمز العنوان الوطني المختصر، أو المدينة/الحي")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Input {...form.register("nationalAddressCode")} className="h-12 uppercase" dir="ltr" maxLength={8} placeholder={textByLang(isRtl, "National Address Code (e.g. RRRD2929)", "الرمز المختصر (مثال RRRD2929)")} />
                  {form.formState.errors.nationalAddressCode && (
                    <p className="mt-1 text-sm text-red-600">{textByLang(isRtl, "4 letters followed by 4 digits", "4 أحرف ثم 4 أرقام")}</p>
                  )}
                </div>
                <Input {...form.register("addressNotes")} className="h-12" placeholder={textByLang(isRtl, "City, district, building, landmark…", "المدينة، الحي، المبنى، أقرب معلَم…")} />
              </div>
            </VendorField>

            <VendorField label={textByLang(isRtl, "Preferred Delivery Date (optional)", "تاريخ التسليم المفضّل (اختياري)")}>
              <Input type="date" {...form.register("requestedDeliveryDate")} className="h-12" />
            </VendorField>

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div>
                <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
                <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onQuoteTurnstileVerified" data-language={isRtl ? "ar" : "en"} />
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-8 border-t border-brand-dark/10 pt-6">
        <Button type="submit" size="lg" disabled={isLoading || !emailVerified || !turnstileToken} className="w-full rounded-full bg-brand-primary hover:bg-brand-dark sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : textByLang(isRtl, "Submit Request", "إرسال الطلب")}
        </Button>
        {submitError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
      </div>
    </form>
  );
}
