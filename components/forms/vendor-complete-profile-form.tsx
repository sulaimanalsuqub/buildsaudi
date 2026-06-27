"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Search, Upload } from "lucide-react";
import { EmailVerify } from "@/components/ui/email-verify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  optionLabel,
  optionValuesToLabels,
  paymentTerms,
  productCategories,
  regions,
  saudiBanks,
  saudiIbanRegex,
  textByLang,
  vendorTypes,
  yesNoOptions,
} from "@/lib/vendor-options";
import { nameSimilarity } from "@/lib/supplier-identity-verification";
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
  email: string;
};

const schema = z
  .object({
    vendorType: z.string().min(1, "required"),
    representedBrands: z.string().optional(),
    productCategories: z.array(z.string()).min(1, "required"),
    coverageRegions: z.array(z.string()).min(1, "required"),
    hasWarehouseInKsa: z.enum(["yes", "no"]),
    offersCredit: z.enum(["yes", "no"]),
    paymentTerms: z.array(z.string()).min(1, "required"),
    creditLimit: z.string().optional(),
    workedOnGovProjects: z.enum(["yes", "no"]),
    bankName: z.string().min(2, "required"),
    iban: z.string().regex(saudiIbanRegex, "invalidIban"),
    ibanAccountName: z.string().trim().min(2, "required"),
    crNameOnDocument: z.string().trim().min(2, "required"),
    // الرقم الضريبي والعنوان الوطني لم يعودا إدخالًا يدويًا — يُرفعان كمستندات ويُستخلصان آليًا (يُراجعان بعد التقديم)
  })
  .superRefine((v, ctx) => {
    if (v.vendorType === "importer" && !v.representedBrands?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["representedBrands"], message: "required" });
    }
    if (v.offersCredit === "yes" && !v.creditLimit?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["creditLimit"], message: "required" });
    }
  });

type FormValues = z.infer<typeof schema>;

const stepFields: (keyof FormValues)[][] = [
  ["productCategories", "vendorType", "representedBrands"],
  ["coverageRegions", "hasWarehouseInKsa", "offersCredit", "paymentTerms", "creditLimit", "workedOnGovProjects"],
  ["bankName", "iban", "ibanAccountName", "crNameOnDocument"],
  [],
];

export function VendorCompleteProfileForm({ isRtl = false, onboardingToken, establishmentName, email }: Props) {
  const [step, setStep] = useState(0);
  const [emailToken, setEmailToken] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [crFile, setCrFile] = useState<{ name: string; token: string } | null>(null);
  const [bankFile, setBankFile] = useState<{ name: string; token: string } | null>(null);
  const [vatFile, setVatFile] = useState<{ name: string; token: string } | null>(null);
  const [addressFile, setAddressFile] = useState<{ name: string; token: string } | null>(null);
  const [uploading, setUploading] = useState<"cr" | "bank" | "vat" | "address" | null>(null);

  const t = {
    stepLabels: isRtl
      ? ["الفئات والنشاط", "التغطية والمالية", "البنك والمستندات", "المراجعة"]
      : ["Categories", "Coverage & Finance", "Bank & Documents", "Review"],
    title: textByLang(isRtl, "Complete your supply profile", "أكمل ملف التوريد"),
    body: textByLang(
      isRtl,
      `Welcome ${establishmentName}. Verify your email, then complete the details below.`,
      `مرحباً ${establishmentName}. تحقق من بريدك ثم أكمل البيانات أدناه.`
    ),
    verifyTitle: textByLang(isRtl, "Verify your email", "تحقق من بريدك الإلكتروني"),
    successTitle: textByLang(isRtl, "Profile Completed", "تم إكمال ملف التوريد"),
    successBody: textByLang(
      isRtl,
      "Your supply profile was submitted. Build will review your file and documents, then confirm final approval before RFQ matching.",
      "تم إرسال ملف التوريد. سيراجعه فريق بيلد مع المستندات، ثم يؤكد الاعتماد النهائي قبل إضافتكم في فرص التوريد."
    ),
    notProvided: textByLang(isRtl, "Not provided", "غير محدد"),
    selected: textByLang(isRtl, "selected", "محدد"),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorType: "",
      representedBrands: "",
      productCategories: [],
      coverageRegions: [],
      hasWarehouseInKsa: "yes",
      offersCredit: "yes",
      paymentTerms: [],
      creditLimit: "",
      workedOnGovProjects: "yes",
      bankName: "",
      iban: "",
      ibanAccountName: "",
      crNameOnDocument: "",
    },
    mode: "onBlur",
  });

  const values = form.watch();
  const progress = ((step + 1) / t.stepLabels.length) * 100;

  // حفظ مسودة تلقائي (قيم الحقول فقط — لا رموز رفع الملفات لأنها قد تنتهي صلاحيتها)
  const draftKey = `build-vendor-profile-draft:${email}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) form.reset({ ...form.getValues(), ...JSON.parse(saved) });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const sub = form.watch((v) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(v));
      } catch {
        // ignore
      }
    });
    return () => sub.unsubscribe();
  }, [form, draftKey]);

  const visibleRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter((r) => r.en.toLowerCase().includes(q) || r.ar.toLowerCase().includes(q));
  }, [regionSearch]);

  const toggleMulti = (field: "productCategories" | "coverageRegions" | "paymentTerms", value: string) => {
    const current = form.getValues(field);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    form.setValue(field, next, { shouldValidate: true });
  };

  async function uploadDoc(file: File, kind: "cr" | "bank" | "vat" | "address") {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error as string) || "upload failed");
      const entry = { name: data.fileName as string, token: data.attachToken as string };
      if (kind === "cr") setCrFile(entry);
      else if (kind === "bank") setBankFile(entry);
      else if (kind === "vat") setVatFile(entry);
      else setAddressFile(entry);
      setSubmitError("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : isRtl ? "فشل رفع الملف" : "File upload failed");
    } finally {
      setUploading(null);
    }
  }

  const validateIdentityMatches = (data: FormValues): string | null => {
    const crMatch = nameSimilarity(establishmentName, data.crNameOnDocument);
    const ibanMatch = nameSimilarity(establishmentName, data.ibanAccountName);
    if (crMatch < 0.5) {
      return isRtl
        ? "اسم المنشأة في السجل التجاري لا يطابق اسم التسجيل"
        : "CR document name does not match registered establishment name";
    }
    if (ibanMatch < 0.5) {
      return isRtl
        ? "اسم صاحب الحساب في البنك لا يطابق اسم التسجيل"
        : "Bank account name does not match registered establishment name";
    }
    return null;
  };

  const handleNext = async () => {
    if (!emailVerified) return;
    if (step === 2) {
      if (!crFile || !bankFile || !vatFile || !addressFile) {
        setSubmitError(
          isRtl
            ? "يرجى رفع: السجل التجاري، خطاب البنك، شهادة الضريبة، والعنوان الوطني"
            : "Upload: CR, bank letter, VAT certificate, and national address"
        );
        return;
      }
    }
    const valid = await form.trigger(stepFields[step]);
    if (!valid) return;
    if (step === 2) {
      const identityError = validateIdentityMatches(form.getValues());
      if (identityError) {
        setSubmitError(identityError);
        return;
      }
    }
    setSubmitError("");
    setStep((s) => Math.min(s + 1, t.stepLabels.length - 1));
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!crFile || !bankFile || !vatFile || !addressFile) {
      setSubmitError(isRtl ? "جميع المستندات مطلوبة" : "All documents are required");
      return;
    }
    const identityError = validateIdentityMatches(data);
    if (identityError) {
      setSubmitError(identityError);
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
          email_verified_token: emailToken,
          vendor_type: data.vendorType,
          represented_brands: data.representedBrands || "",
          product_categories: data.productCategories,
          coverage_regions: data.coverageRegions,
          has_warehouse: data.hasWarehouseInKsa === "yes",
          offers_credit: data.offersCredit === "yes",
          credit_limit: data.creditLimit ? Number(data.creditLimit) : null,
          payment_terms: data.paymentTerms,
          worked_on_gov_projects: data.workedOnGovProjects === "yes",
          bank_name: data.bankName,
          iban: data.iban.toUpperCase(),
          iban_account_name: data.ibanAccountName,
          cr_name_on_document: data.crNameOnDocument,
          cr_document_name: crFile.name,
          cr_attach_token: crFile.token,
          bank_letter_name: bankFile.name,
          bank_letter_attach_token: bankFile.token,
          vat_document_name: vatFile.name,
          vat_attach_token: vatFile.token,
          address_document_name: addressFile.name,
          address_attach_token: addressFile.token,
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(result?.error || "failed");
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      setIsSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "error");
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

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl rounded-2xl border border-brand-dark/10 bg-white p-5 md:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <h2 className="text-2xl font-bold text-brand-dark">{t.title}</h2>
      <p className="mt-2 text-sm text-brand-dark/65">{t.body}</p>

      {!emailVerified ? (
        <div className="mt-8 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-5">
          <p className="mb-3 font-semibold text-brand-dark">{t.verifyTitle}</p>
          <p className="mb-4 text-sm text-brand-dark/65" dir="ltr">{email}</p>
          <EmailVerify
            email={email}
            isRtl={isRtl}
            onVerified={(token) => {
              setEmailToken(token);
              setEmailVerified(true);
            }}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            <div className="flex justify-end">
              <span className="text-xs text-brand-dark/35">{isRtl ? "✓ تُحفظ تلقائياً" : "✓ Auto-saved"}</span>
            </div>
            <VendorStepTabs labels={t.stepLabels} currentStep={step} />
            <div className="h-1.5 rounded-full bg-brand-dark/10">
              <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-brand-primary" />
            </div>
          </div>

          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
            {step === 0 && (
              <>
                <VendorField label={textByLang(isRtl, "Product Categories", "فئات المنتجات")}>
                  <VendorOptionGrid className="lg:grid-cols-3">
                    {productCategories.map((opt) => (
                      <VendorOptionCard key={opt.value} checked={values.productCategories.includes(opt.value)}>
                        <Checkbox checked={values.productCategories.includes(opt.value)} onCheckedChange={() => toggleMulti("productCategories", opt.value)} />
                        <span>{optionLabel(isRtl, productCategories, opt.value)}</span>
                      </VendorOptionCard>
                    ))}
                  </VendorOptionGrid>
                  <VendorErrorText text={form.formState.errors.productCategories?.message} isRtl={isRtl} />
                </VendorField>
                <VendorField label={textByLang(isRtl, "Supplier Type", "نوع المورد")}>
                  <RadioGroup value={values.vendorType} onValueChange={(v) => form.setValue("vendorType", v, { shouldValidate: true })} className="grid gap-3 md:grid-cols-2">
                    {vendorTypes.map((opt) => (
                      <label key={opt.value} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", values.vendorType === opt.value && "border-brand-primary bg-brand-primary/5")}>
                        <RadioGroupItem value={opt.value} />
                        <span>{optionLabel(isRtl, vendorTypes, opt.value)}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <VendorErrorText text={form.formState.errors.vendorType?.message} isRtl={isRtl} />
                </VendorField>
                {values.vendorType === "importer" && (
                  <VendorField label={textByLang(isRtl, "Brands", "العلامات")}>
                    <Input {...form.register("representedBrands")} className="h-12" />
                    <VendorErrorText text={form.formState.errors.representedBrands?.message} isRtl={isRtl} />
                  </VendorField>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <VendorField label={textByLang(isRtl, "Coverage Regions", "مناطق التغطية")}>
                  <div className="relative mb-3">
                    <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-brand-dark/40", isRtl ? "right-3" : "left-3")} />
                    <Input value={regionSearch} onChange={(e) => setRegionSearch(e.target.value)} className={cn("h-11", isRtl ? "pr-10" : "pl-10")} placeholder={textByLang(isRtl, "Search...", "ابحث...")} />
                  </div>
                  <VendorOptionGrid>
                    {visibleRegions.map((opt) => (
                      <VendorOptionCard key={opt.value} checked={values.coverageRegions.includes(opt.value)}>
                        <Checkbox checked={values.coverageRegions.includes(opt.value)} onCheckedChange={() => toggleMulti("coverageRegions", opt.value)} />
                        <span>{optionLabel(isRtl, regions, opt.value)}</span>
                      </VendorOptionCard>
                    ))}
                  </VendorOptionGrid>
                  <VendorErrorText text={form.formState.errors.coverageRegions?.message} isRtl={isRtl} />
                </VendorField>
                <VendorField label={textByLang(isRtl, "Warehouse in KSA?", "مستودع في السعودية؟")}>
                  <RadioGroup value={values.hasWarehouseInKsa} onValueChange={(v) => form.setValue("hasWarehouseInKsa", v as "yes" | "no")} className="grid gap-3 md:grid-cols-2">
                    {yesNoOptions.map((o) => (
                      <label key={o.value} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                        <RadioGroupItem value={o.value} />
                        <span>{optionLabel(isRtl, yesNoOptions, o.value)}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </VendorField>
                <div className="grid gap-4 md:grid-cols-2">
                  <VendorField label={textByLang(isRtl, "Offers credit?", "هل تقدمون آجل؟")}>
                    <RadioGroup value={values.offersCredit} onValueChange={(v) => form.setValue("offersCredit", v as "yes" | "no", { shouldValidate: true })} className="grid gap-3 md:grid-cols-2">
                      {yesNoOptions.map((o) => (
                        <label key={o.value} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                          <RadioGroupItem value={o.value} />
                          <span>{optionLabel(isRtl, yesNoOptions, o.value)}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </VendorField>
                  <VendorField label={textByLang(isRtl, "Government projects?", "مشاريع حكومية؟")}>
                    <RadioGroup value={values.workedOnGovProjects} onValueChange={(v) => form.setValue("workedOnGovProjects", v as "yes" | "no", { shouldValidate: true })} className="grid gap-3 md:grid-cols-2">
                      {yesNoOptions.map((o) => (
                        <label key={o.value} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                          <RadioGroupItem value={o.value} />
                          <span>{optionLabel(isRtl, yesNoOptions, o.value)}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </VendorField>
                </div>
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
                {values.offersCredit === "yes" && (
                  <VendorField label={textByLang(isRtl, "Credit limit (SAR)", "الحد الائتماني (ريال)")}>
                    <Input {...form.register("creditLimit")} className="h-12" dir="ltr" type="number" min="0" />
                    <VendorErrorText text={form.formState.errors.creditLimit?.message} isRtl={isRtl} />
                  </VendorField>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-sm text-brand-dark/80">
                  <p className="font-semibold text-brand-dark">
                    {textByLang(isRtl, "Registered establishment (must match documents)", "اسم المنشأة المسجل — يجب أن يطابق المستندات")}
                  </p>
                  <p className="mt-1 font-medium" dir="rtl">{establishmentName}</p>
                  <p className="mt-2 text-xs text-brand-dark/65">
                    {textByLang(
                      isRtl,
                      "Enter names exactly as they appear on the CR and bank letter. Tax number and national address are verified automatically.",
                      "أدخل الأسماء كما هي في السجل التجاري وخطاب البنك. الرقم الضريبي والعنوان الوطني يُتحقق منهما تلقائياً."
                    )}
                  </p>
                </div>
                <VendorField label={textByLang(isRtl, "Name on Commercial Registration", "اسم المنشأة في السجل التجاري")}>
                  <Input {...form.register("crNameOnDocument")} className="h-12" dir="rtl" placeholder={establishmentName} />
                  <VendorErrorText text={form.formState.errors.crNameOnDocument?.message} isRtl={isRtl} />
                </VendorField>
                <VendorField label={textByLang(isRtl, "Bank Name", "اسم البنك")}>
                  <select
                    value={values.bankName}
                    onChange={(e) => form.setValue("bankName", e.target.value, { shouldValidate: true })}
                    className="h-12 w-full rounded-xl border border-brand-dark/15 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">{textByLang(isRtl, "Select bank", "اختر البنك")}</option>
                    {saudiBanks.map((b) => (
                      <option key={b.value} value={b.value}>
                        {optionLabel(isRtl, saudiBanks, b.value)}
                      </option>
                    ))}
                  </select>
                  <VendorErrorText text={form.formState.errors.bankName?.message} isRtl={isRtl} />
                </VendorField>
                <VendorField label="IBAN">
                  <Input {...form.register("iban")} className="h-12 uppercase" dir="ltr" placeholder="SA0000000000000000000000" />
                  <VendorErrorText text={form.formState.errors.iban?.message} isRtl={isRtl} />
                </VendorField>
                <VendorField label={textByLang(isRtl, "Account Name on Bank Letter", "اسم صاحب الحساب في خطاب البنك")}>
                  <Input {...form.register("ibanAccountName")} className="h-12" dir="rtl" placeholder={establishmentName} />
                  <VendorErrorText text={form.formState.errors.ibanAccountName?.message} isRtl={isRtl} />
                </VendorField>
                <VendorField label={textByLang(isRtl, "CR Document (PDF)", "نسخة السجل التجاري")}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 px-4 py-6 hover:bg-brand-light/50">
                    <Upload className="h-5 w-5 text-brand-primary" />
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "cr")} />
                    <span>{crFile ? "✓ " + crFile.name : textByLang(isRtl, "Upload PDF", "ارفع PDF")}</span>
                    {uploading === "cr" && <Loader2 className="h-4 w-4 animate-spin" />}
                  </label>
                </VendorField>
                <VendorField label={textByLang(isRtl, "Bank Letter (PDF)", "خطاب البنك")}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 px-4 py-6 hover:bg-brand-light/50">
                    <Upload className="h-5 w-5 text-brand-primary" />
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "bank")} />
                    <span>{bankFile ? "✓ " + bankFile.name : textByLang(isRtl, "Upload PDF", "ارفع PDF")}</span>
                    {uploading === "bank" && <Loader2 className="h-4 w-4 animate-spin" />}
                  </label>
                </VendorField>
                <VendorField label={textByLang(isRtl, "VAT Certificate (PDF)", "شهادة الضريبة (PDF)")}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 px-4 py-6 hover:bg-brand-light/50">
                    <Upload className="h-5 w-5 text-brand-primary" />
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "vat")} />
                    <span>{vatFile ? "✓ " + vatFile.name : textByLang(isRtl, "Upload PDF", "ارفع PDF")}</span>
                    {uploading === "vat" && <Loader2 className="h-4 w-4 animate-spin" />}
                  </label>
                </VendorField>
                <VendorField label={textByLang(isRtl, "National Address (PDF)", "العنوان الوطني (PDF)")}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-dark/20 px-4 py-6 hover:bg-brand-light/50">
                    <Upload className="h-5 w-5 text-brand-primary" />
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "address")} />
                    <span>{addressFile ? "✓ " + addressFile.name : textByLang(isRtl, "Upload PDF", "ارفع PDF")}</span>
                    {uploading === "address" && <Loader2 className="h-4 w-4 animate-spin" />}
                  </label>
                </VendorField>
              </>
            )}

            {step === 3 && (
              <dl className="grid gap-3 md:grid-cols-2">
                <VendorReviewRow label="Email" value={email} />
                <VendorReviewRow label={textByLang(isRtl, "Categories", "الفئات")} value={optionValuesToLabels(isRtl, productCategories, values.productCategories)} />
                <VendorReviewRow label={textByLang(isRtl, "CR Name", "اسم السجل")} value={values.crNameOnDocument || t.notProvided} />
                <VendorReviewRow label={textByLang(isRtl, "Tax Number", "الرقم الضريبي")} value={textByLang(isRtl, "Extracted from document", "يُستخلص من المستند")} />
                <VendorReviewRow label={textByLang(isRtl, "National Address", "العنوان الوطني")} value={textByLang(isRtl, "Extracted from document", "يُستخلص من المستند")} />
                <VendorReviewRow label="IBAN" value={values.iban || t.notProvided} />
                <VendorReviewRow label={textByLang(isRtl, "Bank Account Name", "اسم الحساب")} value={values.ibanAccountName || t.notProvided} />
                <VendorReviewRow
                  label={textByLang(isRtl, "Bank", "البنك")}
                  value={values.bankName ? optionLabel(isRtl, saudiBanks, values.bankName) : t.notProvided}
                />
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
        </>
      )}
    </form>
  );
}