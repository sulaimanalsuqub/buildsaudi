"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { documentTypeLabels, isFlexibleIban, optionLabel, regions, textByLang } from "@/lib/vendor-options";
import {
  VendorErrorText,
  VendorField,
  VendorOptionCard,
  VendorOptionGrid,
  VendorReviewRow,
  VendorStepTabs,
} from "@/components/forms/vendor-form-shared";

const vehicleTypeOptions = ["دينا صغيرة", "شاحنة متوسطة", "تريلا/مقطورة", "سطحة", "شاحنة مبردة", "رافعة"];

type Props = {
  isRtl?: boolean;
  onboardingToken: string;
  establishmentName: string;
  carrierType: "local" | "international";
  initialDraft?: Record<string, unknown> | null;
};

const schema = z.object({
  serviceAreas: z.array(z.string()).min(1, "required"),
  vehicleTypes: z.array(z.string()).min(1, "required"),
  loadCapacity: z.string().optional(),
  hasLoading: z.boolean().optional(),
  hasUnloading: z.boolean().optional(),
  hasCrane: z.boolean().optional(),
  hasTracking: z.boolean().optional(),
  urgentShipping: z.boolean().optional(),

  legalName: z.string().optional(),
  entityType: z.string().optional(),
  crNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),

  legalCompanyName: z.string().optional(),
  countryOfRegistration: z.string().optional(),
  registrationNumber: z.string().optional(),
  coveredCountries: z.string().optional(),

  bankName: z.string().min(2, "required"),
  beneficiaryName: z.string().min(2, "required"),
  iban: z.string().trim().refine(isFlexibleIban, "invalidIban"),
  swiftBic: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  serviceAreas: [],
  vehicleTypes: [],
  loadCapacity: "",
  hasLoading: false,
  hasUnloading: false,
  hasCrane: false,
  hasTracking: false,
  urgentShipping: false,
  legalName: "",
  entityType: "",
  crNumber: "",
  vatNumber: "",
  city: "",
  region: "",
  legalCompanyName: "",
  countryOfRegistration: "",
  registrationNumber: "",
  coveredCountries: "",
  bankName: "",
  beneficiaryName: "",
  iban: "",
  swiftBic: "",
};

const stepFields: (keyof FormValues)[][] = [
  ["serviceAreas", "vehicleTypes"],
  ["legalName", "crNumber", "vatNumber", "city", "region", "legalCompanyName", "countryOfRegistration", "registrationNumber"],
  ["bankName", "beneficiaryName", "iban"],
  [],
  [],
];

type DocType = "cr_certificate" | "registration_certificate" | "bank_letter" | "license" | "insurance" | "vehicle_registration";
type UploadedDoc = { name: string; status: "uploading" | "done" | "error" };

export function CarrierCompleteProfileForm({ isRtl = false, onboardingToken, establishmentName, carrierType, initialDraft }: Props) {
  const isLocal = carrierType === "local";
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [docs, setDocs] = useState<Partial<Record<DocType, UploadedDoc>>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const t = {
    stepLabels: isRtl
      ? ["نطاق الخدمة", "بيانات المنشأة", "البنك", "المستندات", "المراجعة"]
      : ["Service Scope", "Establishment", "Bank", "Documents", "Review"],
    title: textByLang(isRtl, "Complete your carrier profile", "أكمل ملف الناقل"),
    body: textByLang(
      isRtl,
      `Welcome ${establishmentName}. Complete the details below to submit your profile for final review.`,
      `مرحباً ${establishmentName}. أكمل البيانات أدناه لإرسال ملفكم للمراجعة النهائية.`
    ),
    successTitle: textByLang(isRtl, "Profile Submitted", "تم إرسال الملف"),
    successBody: textByLang(
      isRtl,
      "Your carrier profile was submitted for final review. Build will confirm approval before matching shipment requests.",
      "تم إرسال ملف الناقل للمراجعة النهائية. سيؤكد فريق بيلد الاعتماد قبل ترشيحكم لطلبات الشحن."
    ),
    notProvided: textByLang(isRtl, "Not provided", "غير محدد"),
    autoSaved: textByLang(isRtl, "Draft saved", "تم حفظ المسودة"),
    saving: textByLang(isRtl, "Saving…", "جارِ الحفظ…"),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyValues, ...(initialDraft ?? {}) },
    mode: "onBlur",
  });
  const values = form.watch();
  const progress = ((step + 1) / t.stepLabels.length) * 100;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const sub = form.watch((v) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await fetch("/api/carriers/draft", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboarding_token: onboardingToken, draft: v }),
          });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("idle");
        }
      }, 2000);
    });
    return () => {
      sub.unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form, onboardingToken]);

  const toggleArea = (value: string) => {
    const current = values.serviceAreas ?? [];
    form.setValue("serviceAreas", current.includes(value) ? current.filter((v) => v !== value) : [...current, value], { shouldValidate: true });
  };
  const toggleVehicle = (value: string) => {
    const current = values.vehicleTypes ?? [];
    form.setValue("vehicleTypes", current.includes(value) ? current.filter((v) => v !== value) : [...current, value], { shouldValidate: true });
  };

  async function uploadDoc(file: File, docType: DocType) {
    setDocs((d) => ({ ...d, [docType]: { name: file.name, status: "uploading" } }));
    try {
      const fd = new FormData();
      fd.append("onboarding_token", onboardingToken);
      fd.append("document_type", docType);
      fd.append("file", file);
      const res = await fetch("/api/carriers/documents", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "upload failed");
      setDocs((d) => ({ ...d, [docType]: { name: file.name, status: "done" } }));
    } catch (err) {
      setDocs((d) => ({ ...d, [docType]: { name: file.name, status: "error" } }));
      setSubmitError(err instanceof Error ? err.message : textByLang(isRtl, "File upload failed", "فشل رفع الملف"));
    }
  }

  const identityDocOk = isLocal ? docs.cr_certificate?.status === "done" : docs.registration_certificate?.status === "done";
  const requiredDocsOk = identityDocOk && docs.bank_letter?.status === "done" && docs.license?.status === "done" && docs.insurance?.status === "done";

  const handleNext = async () => {
    if (step === 3 && !requiredDocsOk) {
      setSubmitError(textByLang(isRtl, "Upload all required documents", "ارفع جميع المستندات المطلوبة"));
      return;
    }
    const valid = await form.trigger(stepFields[step]);
    if (!valid) return;
    setSubmitError("");
    setStep((s) => Math.min(s + 1, t.stepLabels.length - 1));
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!requiredDocsOk) {
      setSubmitError(textByLang(isRtl, "Required documents are missing", "المستندات المطلوبة غير مكتملة"));
      return;
    }
    setIsLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/carriers/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarding_token: onboardingToken,
          local: isLocal
            ? {
                legal_name: data.legalName,
                entity_type: data.entityType,
                cr_number: data.crNumber,
                vat_number: data.vatNumber,
                city: data.city,
                region: data.region,
              }
            : undefined,
          international: !isLocal
            ? {
                legal_company_name: data.legalCompanyName,
                country_of_registration: data.countryOfRegistration,
                registration_number: data.registrationNumber,
              }
            : undefined,
          bank: {
            bank_name: data.bankName,
            beneficiary_name: data.beneficiaryName,
            iban: data.iban.toUpperCase(),
            swift_bic: data.swiftBic || "",
          },
          operations: {
            service_areas: data.serviceAreas,
            vehicle_types: data.vehicleTypes,
            load_capacity: data.loadCapacity || "",
            covered_countries: data.coveredCountries || "",
            has_loading: data.hasLoading,
            has_unloading: data.hasUnloading,
            has_crane: data.hasCrane,
            has_insurance: true,
            has_tracking: data.hasTracking,
            urgent_shipping: data.urgentShipping,
          },
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(result?.error || textByLang(isRtl, "Submission failed", "تعذر إرسال الملف"));
      setIsSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : textByLang(isRtl, "Something went wrong", "حدث خطأ"));
    } finally {
      setIsLoading(false);
    }
  });

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-5xl rounded-2xl border border-brand-primary/20 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-primary" />
        <h2 className="mt-4 text-2xl font-bold text-brand-dark">{t.successTitle}</h2>
        <p className="mt-3 text-brand-dark/75">{t.successBody}</p>
      </section>
    );
  }

  function docUploadField(docType: DocType, label: string, required: boolean) {
    const doc = docs[docType];
    return (
      <VendorField label={`${label}${required ? " *" : ""}`}>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 px-4 py-6 hover:bg-brand-light/50">
          <Upload className="h-5 w-5 text-brand-primary" />
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], docType)} />
          <span>
            {doc?.status === "done" ? "✓ " + doc.name : doc?.status === "error" ? textByLang(isRtl, "Failed — try again", "فشل — أعد المحاولة") : textByLang(isRtl, "Upload PDF", "ارفع PDF")}
          </span>
          {doc?.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
        </label>
      </VendorField>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl rounded-2xl border border-brand-dark/10 bg-white p-5 md:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <h2 className="text-2xl font-bold text-brand-dark">{t.title}</h2>
      <p className="mt-2 text-sm text-brand-dark/65">{t.body}</p>

      <div className="mt-8 space-y-4">
        <div className="flex justify-end">
          <span className="text-xs text-brand-dark/35">{saveStatus === "saving" ? t.saving : saveStatus === "saved" ? `✓ ${t.autoSaved}` : ""}</span>
        </div>
        <VendorStepTabs labels={t.stepLabels} currentStep={step} />
        <div className="h-1.5 rounded-full bg-brand-dark/10">
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-brand-primary" />
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
        {step === 0 && (
          <>
            <VendorField label={textByLang(isRtl, "Service Areas", "مناطق الخدمة")}>
              <VendorOptionGrid>
                {regions.map((r) => (
                  <VendorOptionCard key={r.value} checked={(values.serviceAreas ?? []).includes(r.value)}>
                    <Checkbox checked={(values.serviceAreas ?? []).includes(r.value)} onCheckedChange={() => toggleArea(r.value)} />
                    <span>{optionLabel(isRtl, regions, r.value)}</span>
                  </VendorOptionCard>
                ))}
              </VendorOptionGrid>
              <VendorErrorText text={form.formState.errors.serviceAreas?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Vehicle Types", "أنواع المركبات")}>
              <VendorOptionGrid>
                {vehicleTypeOptions.map((v) => (
                  <VendorOptionCard key={v} checked={(values.vehicleTypes ?? []).includes(v)}>
                    <Checkbox checked={(values.vehicleTypes ?? []).includes(v)} onCheckedChange={() => toggleVehicle(v)} />
                    <span>{v}</span>
                  </VendorOptionCard>
                ))}
              </VendorOptionGrid>
              <VendorErrorText text={form.formState.errors.vehicleTypes?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Load Capacity (optional)", "الحمولات (اختياري)")}>
              <Input {...form.register("loadCapacity")} className="h-12" placeholder={textByLang(isRtl, "e.g. up to 20 tons", "مثال: حتى 20 طن")} />
            </VendorField>

            {!isLocal && (
              <VendorField label={textByLang(isRtl, "Countries Covered (optional)", "الدول المغطاة (اختياري)")}>
                <Input {...form.register("coveredCountries")} className="h-12" />
              </VendorField>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-brand-dark/15 px-4 py-3 text-sm">
                <Checkbox checked={!!values.hasLoading} onCheckedChange={(v) => form.setValue("hasLoading", v === true)} />
                {textByLang(isRtl, "Loading service", "خدمة التحميل")}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-brand-dark/15 px-4 py-3 text-sm">
                <Checkbox checked={!!values.hasUnloading} onCheckedChange={(v) => form.setValue("hasUnloading", v === true)} />
                {textByLang(isRtl, "Unloading service", "خدمة التنزيل")}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-brand-dark/15 px-4 py-3 text-sm">
                <Checkbox checked={!!values.hasCrane} onCheckedChange={(v) => form.setValue("hasCrane", v === true)} />
                {textByLang(isRtl, "Crane available", "رافعة متوفرة")}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-brand-dark/15 px-4 py-3 text-sm">
                <Checkbox checked={!!values.hasTracking} onCheckedChange={(v) => form.setValue("hasTracking", v === true)} />
                {textByLang(isRtl, "Live tracking", "تتبع مباشر")}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-brand-dark/15 px-4 py-3 text-sm">
                <Checkbox checked={!!values.urgentShipping} onCheckedChange={(v) => form.setValue("urgentShipping", v === true)} />
                {textByLang(isRtl, "Urgent shipping available", "شحن عاجل متوفر")}
              </label>
            </div>
          </>
        )}

        {step === 1 && isLocal && (
          <>
            <VendorField label={textByLang(isRtl, "Legal Name", "الاسم النظامي")}>
              <Input {...form.register("legalName")} className="h-12" placeholder={establishmentName} />
            </VendorField>
            <VendorField label={textByLang(isRtl, "Entity Type", "الكيان القانوني")}>
              <Input {...form.register("entityType")} className="h-12" />
            </VendorField>
            <div className="grid gap-4 md:grid-cols-2">
              <VendorField label={textByLang(isRtl, "Commercial Registration No.", "رقم السجل التجاري")}>
                <Input {...form.register("crNumber")} className="h-12" dir="ltr" inputMode="numeric" />
              </VendorField>
              <VendorField label={textByLang(isRtl, "VAT Number", "الرقم الضريبي")}>
                <Input {...form.register("vatNumber")} className="h-12" dir="ltr" inputMode="numeric" />
              </VendorField>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <VendorField label={textByLang(isRtl, "City", "المدينة")}>
                <Input {...form.register("city")} className="h-12" />
              </VendorField>
              <VendorField label={textByLang(isRtl, "Region", "المنطقة")}>
                <Input {...form.register("region")} className="h-12" />
              </VendorField>
            </div>
          </>
        )}

        {step === 1 && !isLocal && (
          <>
            <VendorField label={textByLang(isRtl, "Legal Company Name", "الاسم النظامي للشركة")}>
              <Input {...form.register("legalCompanyName")} className="h-12" placeholder={establishmentName} />
            </VendorField>
            <div className="grid gap-4 md:grid-cols-2">
              <VendorField label={textByLang(isRtl, "Country of Registration", "دولة التسجيل")}>
                <Input {...form.register("countryOfRegistration")} className="h-12" />
              </VendorField>
              <VendorField label={textByLang(isRtl, "Registration Number", "رقم التسجيل")}>
                <Input {...form.register("registrationNumber")} className="h-12" dir="ltr" />
              </VendorField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <VendorField label={textByLang(isRtl, "Bank Name", "اسم البنك")}>
              <Input {...form.register("bankName")} className="h-12" />
              <VendorErrorText text={form.formState.errors.bankName?.message} isRtl={isRtl} />
            </VendorField>
            <VendorField label={textByLang(isRtl, "Account Holder Name", "اسم صاحب الحساب")}>
              <Input {...form.register("beneficiaryName")} className="h-12" placeholder={establishmentName} />
              <VendorErrorText text={form.formState.errors.beneficiaryName?.message} isRtl={isRtl} />
            </VendorField>
            <VendorField label={textByLang(isRtl, "IBAN / Account Number", "الآيبان / رقم الحساب")}>
              <Input {...form.register("iban")} className="h-12 uppercase" dir="ltr" />
              <VendorErrorText text={form.formState.errors.iban?.message} isRtl={isRtl} />
            </VendorField>
            {!isLocal && (
              <VendorField label={textByLang(isRtl, "SWIFT / BIC (optional)", "SWIFT / BIC (اختياري)")}>
                <Input {...form.register("swiftBic")} className="h-12 uppercase" dir="ltr" />
              </VendorField>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-sm text-brand-dark/80">
              {textByLang(isRtl, "Documents marked with * are required before final submission.", "المستندات المُعلَّمة بـ * مطلوبة قبل الإرسال النهائي.")}
            </div>
            {isLocal
              ? docUploadField("cr_certificate", documentTypeLabels.cr_certificate[isRtl ? "ar" : "en"], true)
              : docUploadField("registration_certificate", documentTypeLabels.registration_certificate[isRtl ? "ar" : "en"], true)}
            {docUploadField("bank_letter", documentTypeLabels.bank_letter[isRtl ? "ar" : "en"], true)}
            {docUploadField("license", textByLang(isRtl, "Transport License", "ترخيص النقل"), true)}
            {docUploadField("insurance", textByLang(isRtl, "Insurance Policy", "وثيقة التأمين"), true)}
            {docUploadField("vehicle_registration", textByLang(isRtl, "Vehicle Registration (optional)", "استمارة المركبة (اختياري)"), false)}
          </>
        )}

        {step === 4 && (
          <dl className="grid gap-3 md:grid-cols-2">
            <VendorReviewRow label={textByLang(isRtl, "Service Areas", "مناطق الخدمة")} value={(values.serviceAreas ?? []).map((a) => optionLabel(isRtl, regions, a)).join("، ") || t.notProvided} />
            <VendorReviewRow label={textByLang(isRtl, "Vehicle Types", "أنواع المركبات")} value={(values.vehicleTypes ?? []).join("، ") || t.notProvided} />
            <VendorReviewRow label={isLocal ? textByLang(isRtl, "CR Number", "رقم السجل") : textByLang(isRtl, "Registration Number", "رقم التسجيل")} value={(isLocal ? values.crNumber : values.registrationNumber) || t.notProvided} />
            <VendorReviewRow label="IBAN" value={values.iban || t.notProvided} />
            <VendorReviewRow label={textByLang(isRtl, "Bank", "البنك")} value={values.bankName || t.notProvided} />
          </dl>
        )}
      </motion.div>

      <div className="mt-8 flex justify-between border-t border-brand-dark/10 pt-6">
        <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {textByLang(isRtl, "Back", "السابق")}
        </Button>
        {step < t.stepLabels.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            {textByLang(isRtl, "Continue", "متابعة")}
            {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        ) : (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : textByLang(isRtl, "Submit Profile", "إرسال الملف")}
          </Button>
        )}
      </div>
      {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}
    </form>
  );
}
