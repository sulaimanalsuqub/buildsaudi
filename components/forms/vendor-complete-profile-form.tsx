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
import {
  businessTypes,
  brandRelationshipTypes,
  documentTypeLabels,
  isFlexibleIban,
  optionLabel,
  paymentTerms,
  priceUpdateMethods,
  productCategories,
  regions,
  textByLang,
} from "@/lib/vendor-options";
import {
  VendorErrorText,
  VendorField,
  VendorOptionCard,
  VendorOptionGrid,
  VendorReviewRow,
  VendorStepTabs,
} from "@/components/forms/vendor-form-shared";

type Props = {
  isRtl?: boolean;
  onboardingToken: string;
  establishmentName: string;
  supplierType: "local" | "international";
  initialDraft?: Record<string, unknown> | null;
};

const schema = z.object({
  // النطاق التجاري
  businessType: z.string().min(1, "required"),
  categories: z.array(z.string()).min(1, "required"),
  brands: z.string().optional(),
  serviceAreas: z.array(z.string()).optional(),
  deliveryCities: z.string().optional(),
  paymentTerms: z.array(z.string()).min(1, "required"),

  // بيانات المنشأة — محلي
  legalName: z.string().optional(),
  tradeName: z.string().optional(),
  entityType: z.string().optional(),
  crNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),

  // بيانات المنشأة — دولي
  legalCompanyName: z.string().optional(),
  countryOfRegistration: z.string().optional(),
  registrationNumber: z.string().optional(),
  incoterms: z.string().optional(),

  // البنك
  bankName: z.string().min(2, "required"),
  beneficiaryName: z.string().min(2, "required"),
  iban: z.string().trim().refine(isFlexibleIban, "invalidIban"),
  swiftBic: z.string().optional(),

  // المنتجات (اختياري)
  brandRelationshipType: z.string().optional(),
  priceUpdateMethod: z.string().optional(),
  productNotes: z.string().optional(),

  // جهات الاتصال (اختياري)
  salesContactName: z.string().optional(),
  salesContactEmail: z.string().email().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  businessType: "",
  categories: [],
  brands: "",
  serviceAreas: [],
  deliveryCities: "",
  paymentTerms: [],
  legalName: "",
  tradeName: "",
  entityType: "",
  crNumber: "",
  vatNumber: "",
  city: "",
  region: "",
  legalCompanyName: "",
  countryOfRegistration: "",
  registrationNumber: "",
  incoterms: "",
  bankName: "",
  beneficiaryName: "",
  iban: "",
  swiftBic: "",
  brandRelationshipType: "",
  priceUpdateMethod: "",
  productNotes: "",
  salesContactName: "",
  salesContactEmail: "",
};

const stepFields: (keyof FormValues)[][] = [
  ["businessType", "categories", "paymentTerms"],
  ["legalName", "crNumber", "vatNumber", "city", "region", "legalCompanyName", "countryOfRegistration", "registrationNumber"],
  ["bankName", "beneficiaryName", "iban"],
  [],
  [],
];

type DocType = "cr_certificate" | "vat_certificate" | "bank_letter" | "national_address" | "registration_certificate";
type UploadedDoc = { name: string; status: "uploading" | "done" | "error" };

export function VendorCompleteProfileForm({ isRtl = false, onboardingToken, establishmentName, supplierType, initialDraft }: Props) {
  const isLocal = supplierType === "local";
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [docs, setDocs] = useState<Partial<Record<DocType, UploadedDoc>>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const t = {
    stepLabels: isRtl
      ? ["النطاق التجاري", "بيانات المنشأة", "البنك والمنتجات", "المستندات", "المراجعة"]
      : ["Business Scope", "Establishment", "Bank & Products", "Documents", "Review"],
    title: textByLang(isRtl, "Complete your supply profile", "أكمل ملف التوريد"),
    body: textByLang(
      isRtl,
      `Welcome ${establishmentName}. Complete the details below to submit your profile for final review.`,
      `مرحباً ${establishmentName}. أكمل البيانات أدناه لإرسال ملفكم للمراجعة النهائية.`
    ),
    successTitle: textByLang(isRtl, "Profile Submitted", "تم إرسال الملف"),
    successBody: textByLang(
      isRtl,
      "Your supply profile was submitted for final review. Build will confirm approval before RFQ matching.",
      "تم إرسال ملف التوريد للمراجعة النهائية. سيؤكد فريق بيلد الاعتماد قبل إضافتكم في فرص التوريد."
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

  // حفظ مسودة تلقائي (مُخفَّض التردد — كل تغيير بعد فاصل ثانيتين) عبر Odoo، لا localStorage
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const sub = form.watch((v) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await fetch("/api/vendors/draft", {
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

  const toggleMulti = (field: "categories" | "serviceAreas" | "paymentTerms", value: string) => {
    const current = form.getValues(field) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    form.setValue(field, next, { shouldValidate: true });
  };

  async function uploadDoc(file: File, docType: DocType) {
    setDocs((d) => ({ ...d, [docType]: { name: file.name, status: "uploading" } }));
    try {
      const fd = new FormData();
      fd.append("onboarding_token", onboardingToken);
      fd.append("document_type", docType);
      fd.append("file", file);
      const res = await fetch("/api/vendors/documents", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "upload failed");
      setDocs((d) => ({ ...d, [docType]: { name: file.name, status: "done" } }));
    } catch (err) {
      setDocs((d) => ({ ...d, [docType]: { name: file.name, status: "error" } }));
      setSubmitError(err instanceof Error ? err.message : textByLang(isRtl, "File upload failed", "فشل رفع الملف"));
    }
  }

  const requiredDocsOk = isLocal ? docs.cr_certificate?.status === "done" && docs.bank_letter?.status === "done" : docs.registration_certificate?.status === "done" && docs.bank_letter?.status === "done";

  const handleNext = async () => {
    if (step === 3 && !requiredDocsOk) {
      setSubmitError(
        isLocal
          ? textByLang(isRtl, "Upload the commercial registration and bank letter", "ارفع السجل التجاري وخطاب البنك")
          : textByLang(isRtl, "Upload the registration certificate and bank letter", "ارفع شهادة التسجيل وخطاب البنك")
      );
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
      const res = await fetch("/api/vendors/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarding_token: onboardingToken,
          local: isLocal
            ? {
                legal_name: data.legalName,
                trade_name: data.tradeName,
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
                incoterms: data.incoterms,
              }
            : undefined,
          bank: {
            bank_name: data.bankName,
            beneficiary_name: data.beneficiaryName,
            iban: data.iban.toUpperCase(),
            swift_bic: data.swiftBic || "",
          },
          business: {
            business_type: data.businessType,
            material_categories: data.categories,
            brands: data.brands
              ? data.brands.split(",").map((b) => b.trim()).filter(Boolean)
              : [],
            service_areas: data.serviceAreas ?? [],
            delivery_cities: data.deliveryCities || "",
            payment_terms: data.paymentTerms,
          },
          contacts: {
            sales_contact_name: data.salesContactName || "",
            sales_contact_email: data.salesContactEmail || "",
          },
          products: {
            brand_relationship_type: data.brandRelationshipType || undefined,
            price_update_method: data.priceUpdateMethod || undefined,
            product_notes: data.productNotes || "",
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
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], docType)}
          />
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
          <span className="text-xs text-brand-dark/35">
            {saveStatus === "saving" ? t.saving : saveStatus === "saved" ? `✓ ${t.autoSaved}` : ""}
          </span>
        </div>
        <VendorStepTabs labels={t.stepLabels} currentStep={step} />
        <div className="h-1.5 rounded-full bg-brand-dark/10">
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-brand-primary" />
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
        {step === 0 && (
          <>
            <VendorField label={textByLang(isRtl, "Business Type", "نوع النشاط")}>
              <select
                value={values.businessType}
                onChange={(e) => form.setValue("businessType", e.target.value, { shouldValidate: true })}
                className="h-12 w-full rounded-xl border border-brand-dark/15 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">{textByLang(isRtl, "Select…", "اختر…")}</option>
                {businessTypes.map((b) => (
                  <option key={b.value} value={b.value}>
                    {optionLabel(isRtl, businessTypes, b.value)}
                  </option>
                ))}
              </select>
              <VendorErrorText text={form.formState.errors.businessType?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Product Categories", "فئات المنتجات")}>
              <VendorOptionGrid className="lg:grid-cols-3">
                {productCategories.map((opt) => (
                  <VendorOptionCard key={opt.value} checked={values.categories.includes(opt.value)}>
                    <Checkbox checked={values.categories.includes(opt.value)} onCheckedChange={() => toggleMulti("categories", opt.value)} />
                    <span>{optionLabel(isRtl, productCategories, opt.value)}</span>
                  </VendorOptionCard>
                ))}
              </VendorOptionGrid>
              <VendorErrorText text={form.formState.errors.categories?.message} isRtl={isRtl} />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Represented Brands (optional)", "العلامات التجارية (اختياري)")}>
              <Input {...form.register("brands")} className="h-12" />
            </VendorField>

            {isLocal && (
              <VendorField label={textByLang(isRtl, "Coverage Areas", "مناطق التغطية")}>
                <VendorOptionGrid>
                  {regions.map((opt) => (
                    <VendorOptionCard key={opt.value} checked={(values.serviceAreas ?? []).includes(opt.value)}>
                      <Checkbox checked={(values.serviceAreas ?? []).includes(opt.value)} onCheckedChange={() => toggleMulti("serviceAreas", opt.value)} />
                      <span>{optionLabel(isRtl, regions, opt.value)}</span>
                    </VendorOptionCard>
                  ))}
                </VendorOptionGrid>
              </VendorField>
            )}

            <VendorField label={textByLang(isRtl, "Delivery Cities (optional)", "مدن التسليم (اختياري)")}>
              <Input {...form.register("deliveryCities")} className="h-12" />
            </VendorField>

            <VendorField label={textByLang(isRtl, "Payment Terms", "شروط الدفع")}>
              <VendorOptionGrid>
                {paymentTerms.map((opt) => (
                  <VendorOptionCard key={opt.value} checked={values.paymentTerms.includes(opt.value)}>
                    <Checkbox checked={values.paymentTerms.includes(opt.value)} onCheckedChange={() => toggleMulti("paymentTerms", opt.value)} />
                    <span>{optionLabel(isRtl, paymentTerms, opt.value)}</span>
                  </VendorOptionCard>
                ))}
              </VendorOptionGrid>
              <VendorErrorText text={form.formState.errors.paymentTerms?.message} isRtl={isRtl} />
            </VendorField>
          </>
        )}

        {step === 1 && isLocal && (
          <>
            <VendorField label={textByLang(isRtl, "Legal Name", "الاسم النظامي")}>
              <Input {...form.register("legalName")} className="h-12" placeholder={establishmentName} />
            </VendorField>
            <VendorField label={textByLang(isRtl, "Trade Name (optional)", "الاسم التجاري (اختياري)")}>
              <Input {...form.register("tradeName")} className="h-12" />
            </VendorField>
            <VendorField label={textByLang(isRtl, "Entity Type", "الكيان القانوني")}>
              <Input {...form.register("entityType")} className="h-12" placeholder={textByLang(isRtl, "e.g. LLC, Establishment", "مثال: مؤسسة فردية، شركة ذات مسؤولية محدودة")} />
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
            <VendorField label={textByLang(isRtl, "Incoterms (optional)", "شروط التسليم Incoterms (اختياري)")}>
              <Input {...form.register("incoterms")} className="h-12" dir="ltr" placeholder="FOB, CIF, DDP…" />
            </VendorField>
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
              <Input {...form.register("iban")} className="h-12 uppercase" dir="ltr" placeholder="SA… / account no." />
              <VendorErrorText text={form.formState.errors.iban?.message} isRtl={isRtl} />
            </VendorField>
            {!isLocal && (
              <VendorField label={textByLang(isRtl, "SWIFT / BIC (optional)", "SWIFT / BIC (اختياري)")}>
                <Input {...form.register("swiftBic")} className="h-12 uppercase" dir="ltr" />
              </VendorField>
            )}

            <div className="border-t border-brand-dark/10 pt-6">
              <VendorField label={textByLang(isRtl, "Brand Relationship (optional)", "علاقتكم بالعلامة التجارية (اختياري)")}>
                <select
                  value={values.brandRelationshipType}
                  onChange={(e) => form.setValue("brandRelationshipType", e.target.value)}
                  className="h-12 w-full rounded-xl border border-brand-dark/15 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">{textByLang(isRtl, "Select…", "اختر…")}</option>
                  {brandRelationshipTypes.map((b) => (
                    <option key={b.value} value={b.value}>
                      {optionLabel(isRtl, brandRelationshipTypes, b.value)}
                    </option>
                  ))}
                </select>
              </VendorField>
              <VendorField label={textByLang(isRtl, "Price List Update Method (optional)", "طريقة تحديث قائمة الأسعار (اختياري)")} className="mt-4">
                <select
                  value={values.priceUpdateMethod}
                  onChange={(e) => form.setValue("priceUpdateMethod", e.target.value)}
                  className="h-12 w-full rounded-xl border border-brand-dark/15 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">{textByLang(isRtl, "Select…", "اختر…")}</option>
                  {priceUpdateMethods.map((p) => (
                    <option key={p.value} value={p.value}>
                      {optionLabel(isRtl, priceUpdateMethods, p.value)}
                    </option>
                  ))}
                </select>
              </VendorField>
            </div>
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
            {docUploadField("vat_certificate", documentTypeLabels.vat_certificate[isRtl ? "ar" : "en"], false)}
            {isLocal && docUploadField("national_address", documentTypeLabels.national_address[isRtl ? "ar" : "en"], false)}
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <VendorField label={textByLang(isRtl, "Sales Contact Name (optional)", "اسم مسؤول المبيعات (اختياري)")}>
                <Input {...form.register("salesContactName")} className="h-12" />
              </VendorField>
              <VendorField label={textByLang(isRtl, "Sales Contact Email (optional)", "بريد مسؤول المبيعات (اختياري)")}>
                <Input {...form.register("salesContactEmail")} className="h-12" dir="ltr" />
              </VendorField>
            </div>
            <dl className="grid gap-3 md:grid-cols-2">
              <VendorReviewRow label={textByLang(isRtl, "Business Type", "نوع النشاط")} value={values.businessType ? optionLabel(isRtl, businessTypes, values.businessType) : t.notProvided} />
              <VendorReviewRow label={textByLang(isRtl, "Categories", "الفئات")} value={values.categories.map((c) => optionLabel(isRtl, productCategories, c)).join("، ") || t.notProvided} />
              <VendorReviewRow label={isLocal ? textByLang(isRtl, "CR Number", "رقم السجل") : textByLang(isRtl, "Registration Number", "رقم التسجيل")} value={(isLocal ? values.crNumber : values.registrationNumber) || t.notProvided} />
              <VendorReviewRow label="IBAN" value={values.iban || t.notProvided} />
              <VendorReviewRow label={textByLang(isRtl, "Bank", "البنك")} value={values.bankName || t.notProvided} />
            </dl>
          </>
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
