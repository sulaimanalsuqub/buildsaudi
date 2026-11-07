"use client";
import { interfaceCopy } from "@/lib/dictionaries/interface";


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
  const materialsRef = useRef<HTMLElement>(null);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
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

  const toggleFilesPicked = async (fileList: FileList | null) => {
    if (!fileList?.length || readingFilesRef.current) return;
    setFileError("");
    if (files.length + fileList.length > MAX_FILES) {
      setFileError(interfaceCopy(isRtl, "procurement_request_form_001"));
      return;
    }
    readingFilesRef.current = true;
    setIsReadingFiles(true);
    try {
      const additions: PickedFile[] = [];
      for (const file of Array.from(fileList)) {
        if (!/\.(pdf|csv)$/i.test(file.name)) {
          setFileError(interfaceCopy(isRtl, "procurement_request_form_002"));
          continue;
        }
        if (!file.size || file.size > 8 * 1024 * 1024) {
          setFileError(interfaceCopy(isRtl, "procurement_request_form_003"));
          continue;
        }
        if (files.some((f) => f.name === file.name) || additions.some((f) => f.name === file.name)) continue;
        additions.push({ name: file.name, mimeType: /\.pdf$/i.test(file.name) ? "application/pdf" : "text/csv", base64Data: await readFileAsBase64(file), sizeLabel: formatFileSize(file.size) });
      }
      setFiles((prev) => [...prev, ...additions]);
      if (additions.length) setMaterialsError("");
    } catch {
      setFileError(interfaceCopy(isRtl, "procurement_request_form_004"));
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
    if (!files.length && (data.description?.trim().length || 0) < 5) message = interfaceCopy(isRtl, "procurement_request_form_005");
    setMaterialsError(message);
    return validFields && hasLocation && !message && !readingFilesRef.current;
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => form.handleSubmit(async (data) => {
    if (isLoading || readingFilesRef.current) return;
    if (!(await validateRequirements())) {
      if (!files.length && (data.description?.trim().length || 0) < 5) {
        materialsRef.current?.scrollIntoView({ block: "center" });
        materialsRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    const projectName = data.newProjectName.trim();
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setSubmitError(interfaceCopy(isRtl, "procurement_request_form_006"));
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
      if (res.status === 202) throw new Error(interfaceCopy(isRtl, "procurement_request_form_007"));
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال الطلب");
      setTrackingNumber(result?.tracking_number || "");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : interfaceCopy(isRtl, "procurement_request_form_008"));
    } finally {
      setIsLoading(false);
    }
  }, async () => {
    await validateRequirements();
    const firstInvalidField = ["contactName", "phone", "email", "newProjectName", "city", "nationalAddressCode", "description"] as const;
    const invalidName = firstInvalidField.find((name) => form.formState.errors[name]);
    if (invalidName === "description" && !files.length) {
      materialsRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      materialsRef.current?.focus({ preventScroll: true });
    } else if (invalidName && invalidName !== "nationalAddressCode") {
      form.setFocus(invalidName);
    } else if (!files.length && (form.getValues("description")?.trim().length ?? 0) < 5) {
      materialsRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      materialsRef.current?.focus({ preventScroll: true });
    }
  })(event);

  if (isSubmitted) {
    return (
      <section role="status" className="rounded-xl bg-brand-dark p-6 text-center text-white md:p-9">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 motion-safe:animate-success-ring rounded-full bg-white/30" />
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-primary shadow-xl motion-safe:animate-success-pop">
            <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
          </span>
        </div>

        <h2 className="relative mt-6 text-3xl font-bold leading-tight md:text-4xl">
          {interfaceCopy(isRtl, "procurement_request_form_009")}
        </h2>
        <p className="relative mt-3 text-base leading-7 text-white/90 md:text-lg">
          {interfaceCopy(isRtl, "procurement_request_form_010")}
        </p>

        {trackingNumber && (
          <div className="relative mx-auto mt-7 max-w-md rounded-2xl border border-white/25 bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {interfaceCopy(isRtl, "procurement_request_form_011")}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-widest text-white md:text-3xl" dir="ltr">{trackingNumber}</p>
            <p className="mt-2 text-xs text-white/70">
              {interfaceCopy(isRtl, "procurement_request_form_012")}
            </p>
          </div>
        )}

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={isRtl ? "/ar/track-request" : "/track-request"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-brand-primary shadow-sm transition hover:bg-brand-light"
          >
            {interfaceCopy(isRtl, "procurement_request_form_013")}
          </a>
          <a
            href={isRtl ? "/ar/get-quote" : "/get-quote"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10 px-6 text-base font-semibold text-white transition hover:bg-white/20"
          >
            {interfaceCopy(isRtl, "procurement_request_form_014")}
          </a>
        </div>
      </section>
    );
  }

  const t = (en: string, ar: string) => textByLang(isRtl, en, ar);
  const fieldClass = "h-12 rounded-lg border-brand-dark/25 text-base placeholder:text-brand-dark/70 focus-visible:ring-brand-dark/25";
  const required = <span className="ms-1 text-red-500" aria-hidden="true">*</span>;

  return (
    <div className="mx-auto w-full" dir={isRtl ? "rtl" : "ltr"}>
      <form noValidate onSubmit={onSubmit} className="quote-form min-w-0 space-y-9 bg-white">

        {/* 1. File drop hero */}
        <section ref={materialsRef} tabIndex={-1} aria-labelledby="materials-heading">
          <div className="quote-section-heading">
            <span className="quote-section-number" aria-hidden="true">01</span>
            <Upload className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h2 id="materials-heading" className="text-lg font-bold text-brand-dark">{interfaceCopy(isRtl, "procurement_request_form_101")}</h2>
            {required}
          </div>
          <div className="quote-material-modes mb-5 grid grid-cols-2 gap-2 rounded-lg p-1.5" role="group" aria-label={interfaceCopy(isRtl, "procurement_request_form_102")}>
            {[{value: "file" as const, icon: Upload, en: "Upload a file", ar: "رفع ملف"}, {value: "text" as const, icon: MessageSquare, en: "Write your list", ar: "كتابة القائمة"}].map(mode => <button key={mode.value} type="button" onClick={() => setMaterialMode(mode.value)} aria-pressed={materialMode === mode.value} className={`relative z-0 flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors ${materialMode === mode.value ? "bg-brand-dark text-white" : "text-brand-dark/75 hover:bg-white/70 hover:text-brand-dark"}`}>
              <mode.icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{t(mode.en, mode.ar)}</span>
            </button>)}
          </div>
          <div hidden={materialMode !== "file"}>
            <label onDragOver={handleFilesDragOver} onDragLeave={handleFilesDragLeave} onDrop={handleFilesDrop} className={`quote-upload relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition-colors focus-within:ring-2 focus-within:ring-brand-primary ${isDraggingFiles ? "border-brand-primary bg-brand-primary/10" : "border-brand-dark/20 bg-brand-light/40 hover:border-brand-primary hover:bg-brand-primary/[.04]"}`}>
              <input type="file" aria-label={interfaceCopy(isRtl, "procurement_request_form_103")} multiple accept=".csv,.pdf" disabled={isReadingFiles} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => { void toggleFilesPicked(e.target.files); e.target.value = ""; }} />
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-primary shadow-sm">{isReadingFiles ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}</span>
              <span className="text-base font-bold text-brand-dark">{isReadingFiles ? interfaceCopy(isRtl, "procurement_request_form_104") : interfaceCopy(isRtl, "procurement_request_form_105")}</span>
              <span className="mt-3 inline-flex min-h-10 items-center rounded-md border border-brand-dark/25 bg-white px-5 text-sm font-bold text-brand-dark">{interfaceCopy(isRtl, "procurement_request_form_106")}</span>
              <span className="mt-3 text-xs leading-6 text-brand-dark/70">{interfaceCopy(isRtl, "procurement_request_form_107")}</span>
            </label>

          </div>
          <div hidden={materialMode !== "text"}>
            <label htmlFor="quote-description" className="sr-only">{interfaceCopy(isRtl, "procurement_request_form_108")}</label>
            <textarea id="quote-description" {...form.register("description")} maxLength={200} rows={5} className="w-full rounded-lg border border-brand-dark/25 p-4 text-base leading-7 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" placeholder={interfaceCopy(isRtl, "procurement_request_form_109")} />
            <div className="mt-2 flex justify-between gap-2 text-xs text-brand-dark/70">
              <span>{interfaceCopy(isRtl, "procurement_request_form_110")}</span>
              <span dir="ltr">{values.description?.length || 0} / 200</span>
            </div>

          </div>
          {fileError && <p role="alert" className="mt-2 text-sm text-red-600">{fileError}</p>}
          {files.length > 0 && (
            <ul aria-label={interfaceCopy(isRtl, "procurement_request_form_111")} className="mt-3 space-y-2">
              {files.map((file) => (
                <li key={file.name} className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3 py-2">
                  <FileText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm" dir="auto">{file.name}<span className="ms-2 text-xs text-brand-dark/70">{file.sizeLabel}</span></span>
                  <button type="button" onClick={() => removeFile(file.name)} aria-label={`${interfaceCopy(isRtl, "procurement_request_form_112")} ${file.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-dark/75 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          {materialsError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-600">{materialsError}</p>}
        </section>

        {/* 2. Project location */}
        <section className="border-t border-brand-dark/15 pt-8">
          <div className="quote-section-heading">
            <span className="quote-section-number" aria-hidden="true">02</span>
            <MapPin className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-brand-dark">{interfaceCopy(isRtl, "procurement_request_form_113")}</h2>
            {required}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <QuoteField id="quote-project" label={<>{interfaceCopy(isRtl, "procurement_request_form_114")}{required}</>}><Input id="quote-project" {...form.register("newProjectName")} aria-invalid={!!form.formState.errors.newProjectName} className={fieldClass} placeholder={interfaceCopy(isRtl, "procurement_request_form_115")} /><VendorErrorText text={form.formState.errors.newProjectName?.message} isRtl={isRtl} /></QuoteField>
            <QuoteField id="quote-city" label={<>{interfaceCopy(isRtl, "procurement_request_form_116")}{required}</>}><select id="quote-city" {...form.register("city", { onChange: () => form.clearErrors("city") })} aria-invalid={!!form.formState.errors.city} className="h-12 w-full rounded-lg border border-brand-dark/25 bg-white px-4 text-base outline-none focus:ring-2 focus:ring-brand-primary/20"><option value="">{interfaceCopy(isRtl, "procurement_request_form_117")}</option>{saudiCities.map((c) => <option key={c.value} value={c.value}>{optionLabel(isRtl, saudiCities, c.value)}</option>)}</select><VendorErrorText text={form.formState.errors.city?.message} isRtl={isRtl} /></QuoteField>
          </div>
          <details className="mt-3" open={form.formState.errors.nationalAddressCode ? true : undefined}>
            <summary className="cursor-pointer py-3 text-sm font-medium text-brand-dark/75">{interfaceCopy(isRtl, "procurement_request_form_118")}</summary>
            <div className="mt-3 max-w-sm"><QuoteField id="quote-address" label={interfaceCopy(isRtl, "procurement_request_form_119")}><Input id="quote-address" {...form.register("nationalAddressCode", { setValueAs: (v: string) => v.trim().toUpperCase() })} className={`${fieldClass} uppercase`} dir="ltr" maxLength={8} placeholder="RRRD2929" /><VendorErrorText text={form.formState.errors.nationalAddressCode?.message} isRtl={isRtl} /></QuoteField><p className="mt-2 text-xs text-brand-dark/70">{interfaceCopy(isRtl, "procurement_request_form_120")}</p></div>
          </details>
        </section>

        {/* 3. Contact details */}
        <section className="border-t border-brand-dark/15 pt-8">
          <div className="quote-section-heading">
            <span className="quote-section-number" aria-hidden="true">03</span>
            <MessageSquare className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-brand-dark">{interfaceCopy(isRtl, "procurement_request_form_121")}</h2>
            {required}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <QuoteField id="quote-name" label={<>{interfaceCopy(isRtl, "procurement_request_form_122")}{required}</>}><Input id="quote-name" {...form.register("contactName")} autoComplete="name" aria-invalid={!!form.formState.errors.contactName} className={fieldClass} placeholder={interfaceCopy(isRtl, "procurement_request_form_123")} /><VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} /></QuoteField>
            <QuoteField id="quote-phone" label={<>{interfaceCopy(isRtl, "procurement_request_form_124")}{required}</>}><Input id="quote-phone" {...form.register("phone")} type="tel" autoComplete="tel" dir="ltr" aria-invalid={!!form.formState.errors.phone} className={fieldClass} placeholder="05XXXXXXXX" /><VendorErrorText text={form.formState.errors.phone?.message} isRtl={isRtl} /></QuoteField>
          </div>
          <div className="mt-5">
            <QuoteField id="quote-email" label={<>{interfaceCopy(isRtl, "procurement_request_form_125")}{required}</>}><Input id="quote-email" type="email" {...form.register("email")} autoComplete="email" dir="ltr" aria-invalid={!!form.formState.errors.email} className={fieldClass} placeholder="name@example.com" /><VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} /></QuoteField>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer py-3 text-sm font-medium text-brand-dark/75">{interfaceCopy(isRtl, "procurement_request_form_126")}</summary>
            <div className="mt-3"><QuoteField id="quote-company" label={interfaceCopy(isRtl, "procurement_request_form_127")}><Input id="quote-company" {...form.register("companyName")} autoComplete="organization" className={fieldClass} placeholder={interfaceCopy(isRtl, "procurement_request_form_128")} /></QuoteField></div>
          </details>
        </section>

        {/* Submit */}
        <section className="border-t border-brand-dark/10 pt-6">
          {submitError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
          <div>
            <label className="flex cursor-pointer items-start gap-3 py-2 text-sm leading-6 text-brand-dark/80">
              <Checkbox checked={values.privacyAccepted} onCheckedChange={(v) => form.setValue("privacyAccepted", (v === true) as true, { shouldValidate: true })} />
              <span>{interfaceCopy(isRtl, "procurement_request_form_015")}<a href={isRtl ? "/ar/privacy-policy" : "/privacy-policy"} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-brand-primary">{interfaceCopy(isRtl, "procurement_request_form_129")}</a>{required}</span>
            </label>
            <VendorErrorText text={form.formState.errors.privacyAccepted?.message} isRtl={isRtl} />
          </div>
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <div className="mt-3"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /><div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onQuoteTurnstileVerified" data-expired-callback="onQuoteTurnstileExpired" data-error-callback="onQuoteTurnstileExpired" data-language={isRtl ? "ar" : "en"} data-size="compact" /></div>}
          <Button
            type="submit"
            disabled={isLoading || isReadingFiles}
            className="quote-submit mt-5 h-14 w-full gap-3 rounded-xl bg-brand-accent px-5 text-base text-brand-dark hover:bg-brand-accent/80"
          >
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{interfaceCopy(isRtl, "procurement_request_form_130")}</> : <>{interfaceCopy(isRtl, "procurement_request_form_131")}<Send className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></>}
          </Button>
          <p className="mt-3 text-xs leading-6 text-brand-dark/70">{interfaceCopy(isRtl, "procurement_request_form_132")}</p>
        </section>
      </form>
    </div>
  );
}

function QuoteField({ id, label, children, className = "" }: { id: string; label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-2 ${className}`}><label htmlFor={id} className="block text-sm font-semibold text-brand-dark/85">{label}</label>{children}</div>;
}
