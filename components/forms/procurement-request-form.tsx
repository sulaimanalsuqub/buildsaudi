"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Paperclip, ShieldCheck, X } from "lucide-react";
import { EmailVerify } from "@/components/ui/email-verify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidVendorPhone, normalizeVendorPhone, textByLang } from "@/lib/vendor-options";
import { VendorErrorText, VendorField, VendorOptionCard, VendorPhoneInput } from "@/components/forms/vendor-form-shared";

const DeliveryMapPicker = dynamic(() => import("@/components/forms/delivery-map-picker").then((m) => m.DeliveryMapPicker), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse rounded-xl bg-brand-dark/5" />,
});

type PickedFile = { name: string; mimeType: string; base64Data: string; sizeLabel: string };
type CustomerLookup = { contactName: string; companyName: string; phone: string; projects: string[] };

const MAX_FILES = 5;
const NEW_PROJECT = "__new__";

const formSchema = z.object({
  email: z.string().email("invalidEmail"),
  contactName: z.string().min(2, "required"),
  companyName: z.string().optional(),
  phone: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  projectChoice: z.string().optional(),
  newProjectName: z.string().optional(),
  description: z.string().min(5, "required"),
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState("");
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
      const body = (await res.json().catch(() => null)) as { ok?: boolean; found?: boolean } & Partial<CustomerLookup> | null;
      if (body?.ok && body.found) {
        const data: CustomerLookup = { contactName: body.contactName || "", companyName: body.companyName || "", phone: body.phone || "", projects: body.projects || [] };
        setLookup(data);
        form.setValue("contactName", data.contactName);
        form.setValue("companyName", data.companyName);
        form.setValue("phone", data.phone);
        if (data.projects.length) form.setValue("projectChoice", data.projects[0]);
      }
    } catch {
      // فشل البحث لا يوقف الفورم — تكملة الإدخال يدوياً
    } finally {
      setLookupChecked(true);
    }
  };

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

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const onSubmit = form.handleSubmit(async (data) => {
    if (!emailVerified) {
      form.setError("email", { message: "required" });
      setSubmitError(textByLang(isRtl, "Please verify your email first", "يجب التحقق من البريد الإلكتروني أولاً"));
      return;
    }
    if (!location) {
      setSubmitError(textByLang(isRtl, "Please set the delivery location on the map", "يرجى تحديد موقع التسليم على الخريطة"));
      return;
    }
    const hasExistingProjects = !!lookup && lookup.projects.length > 0;
    const projectName = hasExistingProjects
      ? data.projectChoice === NEW_PROJECT
        ? data.newProjectName?.trim() || ""
        : data.projectChoice
      : data.newProjectName?.trim() || "";
    if (!projectName) {
      form.setError("newProjectName", { message: "required" });
      setSubmitError(textByLang(isRtl, "Please name your project", "يرجى كتابة اسم المشروع"));
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
          description: data.description.trim(),
          delivery_latitude: location.lat,
          delivery_longitude: location.lng,
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

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl rounded-2xl border border-brand-dark/10 bg-white p-5 md:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-6 flex items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand-dark/70 w-fit">
        <ShieldCheck className="h-4 w-4 text-brand-primary" />
        {textByLang(isRtl, "Reviewed by our team", "تتم المراجعة من فريقنا")}
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
              {lookup && lookup.projects.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lookup.projects.map((p) => (
                      <VendorOptionCard key={p} checked={values.projectChoice === p}>
                        <input type="radio" className="h-4 w-4 accent-brand-primary" checked={values.projectChoice === p} onChange={() => form.setValue("projectChoice", p, { shouldValidate: true })} />
                        {p}
                      </VendorOptionCard>
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

            <VendorField label={textByLang(isRtl, "Materials Needed", "المواد المطلوبة")}>
              <textarea
                {...form.register("description")}
                className="min-h-[96px] w-full rounded-xl border border-brand-dark/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                placeholder={textByLang(isRtl, "Describe the materials/quantities needed, or attach a BOQ file below", "صف المواد/الكميات المطلوبة، أو أرفق ملف جدول الكميات أدناه")}
              />
              <VendorErrorText text={form.formState.errors.description?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Delivery Location", "موقع التسليم")}>
              <DeliveryMapPicker value={location} onChange={setLocation} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Delivery Notes (optional)", "ملاحظات العنوان (اختياري)")}>
              <Input {...form.register("addressNotes")} className="h-12" placeholder={textByLang(isRtl, "Building, floor, landmark…", "المبنى، الدور، أقرب معلَم…")} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Preferred Delivery Date (optional)", "تاريخ التسليم المفضّل (اختياري)")}>
              <Input type="date" {...form.register("requestedDeliveryDate")} className="h-12" />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Attach Files (optional)", "إرفاق ملفات (اختياري)")} helper={textByLang(isRtl, "BOQ, drawings, or any reference file", "جدول كميات، مخططات، أو أي ملف مرجعي")}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 px-4 py-6 hover:bg-brand-light/50">
                <Paperclip className="h-5 w-5 text-brand-primary" />
                <input type="file" multiple className="hidden" onChange={(e) => toggleFilesPicked(e.target.files)} />
                <span>{textByLang(isRtl, "Choose files", "اختر ملفات")}</span>
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
