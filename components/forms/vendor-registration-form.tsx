"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Loader2, Search, ShieldCheck } from "lucide-react";
import { EmailVerify } from "@/components/ui/email-verify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type VendorRegistrationFormProps = {
  isRtl?: boolean;
};

type Option = {
  value: string;
  en: string;
  ar: string;
};

const vendorTypes: Option[] = [
  { value: "direct_manufacturer", en: "Direct Manufacturer", ar: "مصنع مباشر" },
  { value: "authorized_distributor", en: "Authorized Distributor", ar: "موزع معتمد" },
  { value: "exclusive_agent", en: "Exclusive Agent", ar: "وكيل حصري" },
  { value: "project_supplier", en: "Project Supplier", ar: "مورد مشاريع" },
  { value: "importer", en: "Importer", ar: "مستورد" }
];

const productCategories: Option[] = [
  { value: "building_materials", en: "Building Materials", ar: "مواد بناء وإنشاء" },
  { value: "safety_tools", en: "Safety Tools", ar: "أدوات السلامة" },
  { value: "paint_decor", en: "Paint & Decor", ar: "دهانات وديكور" },
  { value: "electrical_lighting", en: "Electrical & Lighting", ar: "كهرباء وإنارة" },
  { value: "plumbing", en: "Plumbing", ar: "سباكة" },
  { value: "sanitary_ware", en: "Sanitary Ware", ar: "أدوات صحية" },
  { value: "hvac", en: "HVAC", ar: "تكييف وتبريد" },
  { value: "piping_systems", en: "Piping Systems", ar: "أنظمة الأنابيب" },
  { value: "pumps_tanks", en: "Pumps & Tanks", ar: "مضخات وخزانات" },
  { value: "flooring_ceramics", en: "Flooring & Ceramics", ar: "أرضيات وسيراميك" },
  { value: "insulation", en: "Insulation", ar: "عوازل" },
  { value: "adhesives", en: "Adhesives", ar: "مواد لاصقة" }
];

const regions: Option[] = [
  { value: "riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "makkah", en: "Makkah", ar: "مكة" },
  { value: "madinah", en: "Madinah", ar: "المدينة" },
  { value: "eastern", en: "Eastern Province", ar: "الشرقية" },
  { value: "qassim", en: "Qassim", ar: "القصيم" },
  { value: "asir", en: "Asir", ar: "عسير" },
  { value: "tabuk", en: "Tabuk", ar: "تبوك" },
  { value: "hail", en: "Hail", ar: "حائل" },
  { value: "northern_borders", en: "Northern Borders", ar: "الحدود الشمالية" },
  { value: "jazan", en: "Jazan", ar: "جازان" },
  { value: "najran", en: "Najran", ar: "نجران" },
  { value: "al_baha", en: "Al Baha", ar: "الباحة" },
  { value: "al_jouf", en: "Al Jouf", ar: "الجوف" },
  { value: "all_ksa", en: "All Saudi Arabia", ar: "كل المملكة" }
];

const paymentTerms: Option[] = [
  { value: "bank_transfer", en: "Bank Transfer", ar: "تحويل بنكي" },
  { value: "cheque", en: "Cheque", ar: "شيك" },
  { value: "30_days", en: "30 Days", ar: "30 يوم" },
  { value: "60_days", en: "60 Days", ar: "60 يوم" }
];

const yesNoOptions: Option[] = [
  { value: "yes", en: "Yes", ar: "نعم" },
  { value: "no", en: "No", ar: "لا" }
];

const saudiPhoneRegex = /^(05\d{8}|\+9665\d{8}|009665\d{8})$/;
const crNumberRegex = /^\d{10,15}$/;

const formSchema = z
  .object({
    establishmentName: z.string().min(2, "required"),
    managerName: z.string().min(2, "required"),
    contactNumber: z.string().regex(saudiPhoneRegex, "invalidPhone"),
    email: z.string().email("invalidEmail"),
    crNumber: z.string().regex(crNumberRegex, "invalidCR"),
    productCategories: z.array(z.string()).min(1, "required"),
    vendorType: z.string().min(1, "required"),
    representedBrands: z.string().optional(),
    coverageRegions: z.array(z.string()).min(1, "required"),
    hasWarehouseInKsa: z.enum(["yes", "no"]),
    offersCredit: z.enum(["yes", "no"]),
    paymentTerms: z.array(z.string()).min(1, "required"),
    creditLimit: z.string().optional(),
    workedOnGovProjects: z.enum(["yes", "no"])
  })
  .superRefine((value, ctx) => {
    if (value.vendorType === "importer" && !value.representedBrands?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["representedBrands"], message: "required" });
    }
    if (value.offersCredit === "yes" && !value.creditLimit?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["creditLimit"], message: "required" });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  establishmentName: "",
  managerName: "",
  contactNumber: "",
  email: "",
  crNumber: "",
  productCategories: [],
  vendorType: "",
  representedBrands: "",
  coverageRegions: [],
  hasWarehouseInKsa: "yes",
  offersCredit: "yes",
  paymentTerms: [],
  creditLimit: "",
  workedOnGovProjects: "yes"
};

const stepFields: (keyof FormValues)[][] = [
  ["establishmentName", "managerName", "contactNumber", "email", "crNumber"],
  ["productCategories", "vendorType", "representedBrands"],
  ["coverageRegions", "hasWarehouseInKsa", "offersCredit", "paymentTerms", "creditLimit", "workedOnGovProjects"],
  []
];

const errorMessages: Record<string, { en: string; ar: string }> = {
  required: { en: "This field is required", ar: "هذا الحقل مطلوب" },
  invalidPhone: { en: "Invalid Saudi phone (e.g. 05xxxxxxxx)", ar: "رقم الهاتف غير صحيح (مثال: 05xxxxxxxx)" },
  invalidEmail: { en: "Invalid email address", ar: "البريد الإلكتروني غير صحيح" },
  invalidCR: { en: "CR number must be 10-15 digits", ar: "رقم السجل يجب أن يكون 10-15 رقم" },
};

function localizeError(code: string | undefined, isRtl: boolean): string | undefined {
  if (!code) return undefined;
  const msg = errorMessages[code];
  return msg ? (isRtl ? msg.ar : msg.en) : code;
}

function textByLang(isRtl: boolean, en: string, ar: string) {
  return isRtl ? ar : en;
}

function optionLabel(isRtl: boolean, options: Option[], value: string) {
  const item = options.find((option) => option.value === value);
  if (!item) return value;
  return isRtl ? item.ar : item.en;
}

export function VendorRegistrationForm({ isRtl = false }: VendorRegistrationFormProps) {
  const t = {
    stepLabels: isRtl
      ? ["البيانات الأساسية", "فئات ونوع المورد", "التغطية والمالية", "المراجعة"]
      : ["Basic Information", "Categories & Supplier Type", "Coverage & Finance", "Review"],
    stepDescriptions: isRtl
      ? [
          "بيانات التواصل والسجل التجاري حتى نتحقق من المنشأة بسرعة.",
          "حدد المنتجات وطبيعة نشاطكم لتوجيه فرص التوريد المناسبة.",
          "أخبرنا أين يمكنكم التوريد وما هي شروطكم التجارية.",
          "راجع البيانات قبل إرسال طلب التأهيل إلى فريق بيلد.",
        ]
      : [
          "Contact and CR details so we can verify the company quickly.",
          "Select your products and supplier type to route relevant opportunities.",
          "Tell us where you can supply and your commercial terms.",
          "Review the profile before sending it to the Build team.",
        ],
    stepText: textByLang(isRtl, "Step", "الخطوة"),
    ofText: textByLang(isRtl, "of", "من"),
    submitStateTitle: textByLang(isRtl, "Supply Request Submitted", "تم إرسال طلب التوريد"),
    submitStateBody: textByLang(
      isRtl,
      "Your request has been received. The Build team will contact you about matching supply opportunities.",
      "تم استلام طلبكم بنجاح. سيتواصل فريق بيلد معكم بخصوص فرص التوريد المناسبة."
    ),
    searchRegions: textByLang(isRtl, "Search region...", "ابحث عن منطقة..."),
    formEyebrow: textByLang(isRtl, "Supplier qualification", "تأهيل الموردين"),
    formTitle: textByLang(isRtl, "Tell us what you can supply", "عرّفنا بما يمكنكم توريده"),
    formBody: textByLang(
      isRtl,
      "Complete the short profile below. Accurate details help us match your company with the right RFQs.",
      "أكمل الملف المختصر أدناه. دقة البيانات تساعدنا على مطابقة منشأتكم مع طلبات التسعير المناسبة."
    ),
    secureNote: textByLang(isRtl, "Reviewed by Build operations", "تتم المراجعة من فريق عمليات بيلد"),
    selectedText: textByLang(isRtl, "selected", "محدد"),
    noRegions: textByLang(isRtl, "No matching regions", "لا توجد مناطق مطابقة"),
    labels: {
      establishmentName: textByLang(isRtl, "Establishment Name", "اسم المنشأة"),
      managerName: textByLang(isRtl, "Responsible Person", "المسؤول"),
      contactNumber: textByLang(isRtl, "Contact Number", "رقم التواصل"),
      email: textByLang(isRtl, "Email", "البريد الإلكتروني"),
      crNumber: textByLang(isRtl, "Commercial Registration Number", "رقم السجل"),
      productCategories: textByLang(isRtl, "Product Categories", "فئة المنتجات"),
      vendorType: textByLang(isRtl, "You Are", "هل أنتم"),
      representedBrands: textByLang(isRtl, "Brands You Represent", "العلامات التجارية التي تمثلونها"),
      coverageRegions: textByLang(isRtl, "Coverage Regions", "مناطق التغطية"),
      hasWarehouseInKsa: textByLang(isRtl, "Do you have a warehouse in KSA?", "هل لديكم مستودع داخل المملكة؟"),
      offersCredit: textByLang(isRtl, "Can you provide credit terms?", "هل لديكم قدرة على منح آجل؟"),
      paymentTerms: textByLang(isRtl, "Payment Terms", "شروط الدفع"),
      creditLimit: textByLang(isRtl, "Estimated Credit Limit", "الحد الائتماني التقريبي"),
      workedOnGovProjects: textByLang(isRtl, "Worked on government projects before?", "هل سبق لكم العمل في مشاريع حكومية؟")
    },
    actions: {
      back: textByLang(isRtl, "Back", "السابق"),
      next: textByLang(isRtl, "Continue", "متابعة"),
      submit: textByLang(isRtl, "Submit Supply Request", "إرسال طلب التوريد")
    },
    review: textByLang(isRtl, "Review Details", "مراجعة البيانات"),
    notProvided: textByLang(isRtl, "Not provided", "غير محدد"),
    helpers: {
      establishmentName: textByLang(isRtl, "Use the legal name shown on your commercial registration.", "اكتب الاسم النظامي كما يظهر في السجل التجاري."),
      productCategories: textByLang(isRtl, "Choose every category you can price reliably.", "اختر كل الفئات التي تستطيعون تسعيرها بثقة."),
      coverageRegions: textByLang(isRtl, "Select the regions you can supply directly or through logistics partners.", "حدد المناطق التي تستطيعون تغطيتها مباشرة أو عبر شركاء لوجستيين."),
      paymentTerms: textByLang(isRtl, "Choose the payment options your team can support for projects.", "اختر خيارات الدفع التي يمكنكم دعمها للمشاريع.")
    }
  };

  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur"
  });

  const progress = ((step + 1) / t.stepLabels.length) * 100;
  const values = form.watch();
  const emailVerified = !!verifiedEmail && verifiedEmail === values.email.trim().toLowerCase() && !!emailToken;

  const visibleRegions = useMemo(() => {
    const query = regionSearch.trim().toLowerCase();
    if (!query) return regions;
    return regions.filter((item) => item.en.toLowerCase().includes(query) || item.ar.toLowerCase().includes(query));
  }, [regionSearch]);

  const toggleMultiValue = (field: "productCategories" | "coverageRegions" | "paymentTerms", value: string) => {
    const current = form.getValues(field);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    form.setValue(field, next, { shouldValidate: true, shouldDirty: true });
  };

  const handleNext = async () => {
    const valid = await form.trigger(stepFields[step]);
    if (!valid) return;
    if (step === 0 && !emailVerified) {
      form.setError("email", { message: "required" });
      setSubmitError(isRtl ? "يجب التحقق من البريد الإلكتروني أولاً" : "Please verify your email first");
      return;
    }
    setSubmitError("");
    setStep((prev) => Math.min(prev + 1, t.stepLabels.length - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_name: data.establishmentName,
          manager_name: data.managerName,
          contact_number: data.contactNumber,
          email: data.email,
          email_verified_token: emailToken,
          cr_number: data.crNumber,
          vendor_type: data.vendorType,
          represented_brands: data.representedBrands || "",
          product_categories: data.productCategories,
          coverage_regions: data.coverageRegions,
          has_warehouse: data.hasWarehouseInKsa === "yes",
          offers_credit: data.offersCredit === "yes",
          credit_limit: data.creditLimit ? Number(data.creditLimit) : null,
          payment_terms: data.paymentTerms,
          worked_on_gov_projects: data.workedOnGovProjects === "yes",
        }),
      });
      const result = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال طلب التوريد");

      setIsSubmitted(true);
    } catch (error) {
      const fallback = isRtl ? "حدث خطأ أثناء الإرسال. حاول مجدداً." : "Something went wrong. Please try again.";
      setSubmitError(error instanceof Error ? error.message : fallback);
    } finally {
      setIsLoading(false);
    }
  }, () => {
    // عند فشل validation — نرجع لأول خطوة فيها خطأ
    const errorFields = Object.keys(form.formState.errors) as (keyof FormValues)[];
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];
      const errorStep = stepFields.findIndex((fields) => fields.includes(firstErrorField));
      if (errorStep >= 0) setStep(errorStep);
      setSubmitError(isRtl ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields");
    }
  });

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-5xl rounded-2xl border border-brand-primary/20 bg-white p-8 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="type-section-title mx-auto mt-5 text-brand-dark">{t.submitStateTitle}</h2>
        <p className="type-body mx-auto mt-4 max-w-lg text-brand-dark/80">{t.submitStateBody}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => { form.reset(defaultValues); setIsSubmitted(false); setStep(0); setSubmitError(""); }}
            className="rounded-full border border-brand-dark/20 px-8 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/[0.04]"
          >
            {isRtl ? "تسجيل مورد آخر" : "Register Another Supplier"}
          </button>
          <a
            href={isRtl ? "/ar" : "/"}
            className="rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </a>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl rounded-2xl border border-brand-dark/10 bg-white p-5 md:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-8 space-y-6">
        <div className="flex flex-col gap-5 border-b border-brand-dark/10 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
              <ClipboardCheck className="h-4 w-4" />
              {t.formEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-brand-dark md:text-3xl">{t.formTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-dark/65">{t.formBody}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand-dark/70">
            <ShieldCheck className="h-4 w-4 text-brand-primary" />
            {t.secureNote}
          </div>
        </div>

        <StepTabs labels={t.stepLabels} currentStep={step} />

        <div className="h-1.5 w-full rounded-full bg-brand-dark/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.28 }}
            className="h-full rounded-full bg-brand-primary"
          />
        </div>
        <div className="rounded-xl bg-brand-light/60 p-4">
          <p className="text-sm font-bold text-brand-dark">
            {t.stepText} {step + 1} {t.ofText} {t.stepLabels.length}: {t.stepLabels[step]}
          </p>
          <p className="mt-1 text-sm leading-6 text-brand-dark/65">{t.stepDescriptions[step]}</p>
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="space-y-6">
        {step === 0 && (() => {
          const showManager = values.establishmentName.trim().length >= 2;
          const showPhone = showManager && values.managerName.trim().length >= 2;
          const showEmail = showPhone && saudiPhoneRegex.test(values.contactNumber.replace(/\s/g, ""));
          const showVerify = showEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) && !emailVerified;
          const showCR = showEmail;
          return (
            <div className="space-y-5">
              <Field label={t.labels.establishmentName} helper={t.helpers.establishmentName}>
                <Input {...form.register("establishmentName")} autoComplete="organization" className="h-12 text-base" autoFocus />
                <ErrorText text={form.formState.errors.establishmentName?.message} isRtl={isRtl} />
              </Field>

              <AnimatePresence>
                {showManager && (
                  <motion.div key="manager" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Field label={t.labels.managerName}>
                      <Input {...form.register("managerName")} autoComplete="name" className="h-12 text-base" />
                      <ErrorText text={form.formState.errors.managerName?.message} isRtl={isRtl} />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showPhone && (
                  <motion.div key="phone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Field label={t.labels.contactNumber}>
                      <Input {...form.register("contactNumber")} autoComplete="tel" className="h-12 text-base" dir="ltr" placeholder="05xxxxxxxx" />
                      <ErrorText text={form.formState.errors.contactNumber?.message} isRtl={isRtl} />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showEmail && (
                  <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
                    <Field label={t.labels.email}>
                      <Input type="email" {...form.register("email")} autoComplete="email" className="h-12 text-base" dir="ltr" placeholder="example@company.com" />
                      <ErrorText text={form.formState.errors.email?.message} isRtl={isRtl} />
                    </Field>
                    <AnimatePresence mode="wait">
                      {emailVerified ? (
                        <motion.div key="verified" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            <span className="font-semibold">{isRtl ? "تم التحقق من البريد الإلكتروني ✓" : "Email verified ✓"}</span>
                          </div>
                        </motion.div>
                      ) : showVerify ? (
                        <motion.div key="verify-widget" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                          <EmailVerify
                            email={values.email.trim()}
                            isRtl={isRtl}
                            onVerified={(token) => {
                              setVerifiedEmail(values.email.trim().toLowerCase());
                              setEmailToken(token);
                              form.clearErrors("email");
                              setSubmitError("");
                            }}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showCR && (
                  <motion.div key="cr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Field label={t.labels.crNumber}>
                      <Input {...form.register("crNumber")} inputMode="numeric" className="h-12 text-base" dir="ltr" placeholder="1234567890" />
                      <ErrorText text={form.formState.errors.crNumber?.message} isRtl={isRtl} />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {step === 1 && (
          <div className="content-stack">
            <Field label={t.labels.productCategories} helper={`${t.helpers.productCategories} ${values.productCategories.length} ${t.selectedText}.`}>
              <OptionGrid className="lg:grid-cols-3">
                {productCategories.map((option) => {
                  const checked = values.productCategories.includes(option.value);
                  return (
                    <OptionCard key={option.value} checked={checked}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleMultiValue("productCategories", option.value)} />
                      <span>{optionLabel(isRtl, productCategories, option.value)}</span>
                    </OptionCard>
                  );
                })}
              </OptionGrid>
              <ErrorText text={form.formState.errors.productCategories?.message} isRtl={isRtl} />
            </Field>

            <Field label={t.labels.vendorType}>
              <RadioGroup value={values.vendorType} onValueChange={(value) => form.setValue("vendorType", value, { shouldValidate: true, shouldDirty: true })} className="grid gap-3 md:grid-cols-2">
                {vendorTypes.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
                      values.vendorType === option.value ? "border-brand-primary bg-brand-primary/5" : "border-brand-dark/15 hover:border-brand-dark/30"
                    )}
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="type-small text-brand-dark/90">{optionLabel(isRtl, vendorTypes, option.value)}</span>
                  </label>
                ))}
              </RadioGroup>
              <ErrorText text={form.formState.errors.vendorType?.message} isRtl={isRtl} />
            </Field>

            {values.vendorType === "importer" && (
              <Field label={t.labels.representedBrands}>
                <Input
                  {...form.register("representedBrands")}
                  className="h-12 text-base"
                  placeholder={textByLang(isRtl, "Example: Brand A, Brand B", "مثال: علامة أ، علامة ب")}
                />
                <ErrorText text={form.formState.errors.representedBrands?.message} isRtl={isRtl} />
              </Field>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="content-stack">
            <Field label={t.labels.coverageRegions} helper={`${t.helpers.coverageRegions} ${values.coverageRegions.length} ${t.selectedText}.`}>
              <div className="relative">
                <Search className={cn("pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-brand-dark/38", isRtl ? "right-4" : "left-4")} />
                <Input
                  value={regionSearch}
                  onChange={(event) => setRegionSearch(event.target.value)}
                  placeholder={t.searchRegions}
                  className={cn("h-12 text-base", isRtl ? "pr-11" : "pl-11")}
                />
              </div>
              <OptionGrid className="lg:grid-cols-3">
                {visibleRegions.map((option) => {
                  const checked = values.coverageRegions.includes(option.value);
                  return (
                    <OptionCard key={option.value} checked={checked}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleMultiValue("coverageRegions", option.value)} />
                      <span>{optionLabel(isRtl, regions, option.value)}</span>
                    </OptionCard>
                  );
                })}
              </OptionGrid>
              {visibleRegions.length === 0 && <p className="rounded-xl bg-brand-light p-4 text-sm font-semibold text-brand-dark/60">{t.noRegions}</p>}
              <ErrorText text={form.formState.errors.coverageRegions?.message} isRtl={isRtl} />
            </Field>

            <BinaryField
              label={t.labels.hasWarehouseInKsa}
              value={values.hasWarehouseInKsa}
              onChange={(value) => form.setValue("hasWarehouseInKsa", value as "yes" | "no", { shouldValidate: true })}
              options={yesNoOptions}
              isRtl={isRtl}
            />

            <BinaryField
              label={t.labels.offersCredit}
              value={values.offersCredit}
              onChange={(value) => form.setValue("offersCredit", value as "yes" | "no", { shouldValidate: true })}
              options={yesNoOptions}
              isRtl={isRtl}
            />

            <Field label={t.labels.paymentTerms} helper={t.helpers.paymentTerms}>
              <OptionGrid>
                {paymentTerms.map((option) => {
                  const checked = values.paymentTerms.includes(option.value);
                  return (
                    <OptionCard key={option.value} checked={checked}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleMultiValue("paymentTerms", option.value)} />
                      <span>{optionLabel(isRtl, paymentTerms, option.value)}</span>
                    </OptionCard>
                  );
                })}
              </OptionGrid>
              <ErrorText text={form.formState.errors.paymentTerms?.message} isRtl={isRtl} />
            </Field>

            {values.offersCredit === "yes" && (
              <Field label={t.labels.creditLimit}>
                <Input
                  {...form.register("creditLimit")}
                  inputMode="decimal"
                  className="h-12 text-base"
                  placeholder={textByLang(isRtl, "Example: 250,000 SAR", "مثال: 250,000 ريال")}
                />
                <ErrorText text={form.formState.errors.creditLimit?.message} isRtl={isRtl} />
              </Field>
            )}

            <BinaryField
              label={t.labels.workedOnGovProjects}
              value={values.workedOnGovProjects}
              onChange={(value) => form.setValue("workedOnGovProjects", value as "yes" | "no", { shouldValidate: true })}
              options={yesNoOptions}
              isRtl={isRtl}
            />
          </div>
        )}

        {step === 3 && (
          <section className="rounded-2xl border border-brand-dark/12 bg-brand-light/55 p-5 md:p-6">
            <h3 className="type-card-title text-brand-dark">{t.review}</h3>
            <dl className="mt-5 grid gap-3 text-sm text-brand-dark/85 md:grid-cols-2">
              <ReviewRow label={t.labels.establishmentName} value={values.establishmentName || t.notProvided} />
              <ReviewRow label={t.labels.managerName} value={values.managerName || t.notProvided} />
              <ReviewRow label={t.labels.contactNumber} value={values.contactNumber || t.notProvided} />
              <ReviewRow label={t.labels.email} value={values.email || t.notProvided} />
              <ReviewRow label={t.labels.crNumber} value={values.crNumber || t.notProvided} />
              <ReviewRow
                label={t.labels.productCategories}
                value={values.productCategories.length ? values.productCategories.map((value) => optionLabel(isRtl, productCategories, value)).join("، ") : t.notProvided}
              />
              <ReviewRow label={t.labels.vendorType} value={values.vendorType ? optionLabel(isRtl, vendorTypes, values.vendorType) : t.notProvided} />
              {values.vendorType === "importer" && <ReviewRow label={t.labels.representedBrands} value={values.representedBrands || t.notProvided} />}
              <ReviewRow
                label={t.labels.coverageRegions}
                value={values.coverageRegions.length ? values.coverageRegions.map((value) => optionLabel(isRtl, regions, value)).join("، ") : t.notProvided}
              />
              <ReviewRow label={t.labels.hasWarehouseInKsa} value={optionLabel(isRtl, yesNoOptions, values.hasWarehouseInKsa)} />
              <ReviewRow label={t.labels.offersCredit} value={optionLabel(isRtl, yesNoOptions, values.offersCredit)} />
              <ReviewRow
                label={t.labels.paymentTerms}
                value={values.paymentTerms.length ? values.paymentTerms.map((value) => optionLabel(isRtl, paymentTerms, value)).join("، ") : t.notProvided}
              />
              <ReviewRow label={t.labels.creditLimit} value={values.creditLimit || t.notProvided} />
              <ReviewRow label={t.labels.workedOnGovProjects} value={optionLabel(isRtl, yesNoOptions, values.workedOnGovProjects)} />
            </dl>
          </section>
        )}
      </motion.div>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-brand-dark/10 pt-6">
        <Button type="button" variant="outline" size="lg" onClick={handleBack} disabled={step === 0} className="type-button gap-2 rounded-full px-6">
          {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t.actions.back}
        </Button>

        {step < t.stepLabels.length - 1 ? (
          <Button type="button" size="lg" onClick={handleNext} className="type-button gap-2 rounded-full bg-brand-primary px-7 hover:bg-brand-dark">
            {t.actions.next}
            {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={isLoading} className="type-button gap-2 rounded-full bg-brand-primary px-7 hover:bg-brand-dark disabled:opacity-60">
            {isLoading ? (isRtl ? "جارٍ الإرسال..." : "Submitting...") : t.actions.submit}
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {submitError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
      )}
    </form>
  );
}

function StepTabs({ labels, currentStep }: { labels: string[]; currentStep: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {labels.map((label, index) => {
        const active = index === currentStep;
        const completed = index < currentStep;
        return (
          <div
            key={label}
            className={cn(
              "flex min-h-[58px] items-center gap-3 rounded-xl border px-3 py-2",
              active || completed ? "border-brand-primary/35 bg-brand-primary/5" : "border-brand-dark/10 bg-white"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                active || completed ? "bg-brand-primary text-white" : "bg-brand-light text-brand-dark/65"
              )}
            >
              {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            <span className={cn("text-sm font-semibold leading-5", active ? "text-brand-dark" : "text-brand-dark/62")}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, helper, children, className }: { label: string; helper?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {helper && <p className="text-sm leading-6 text-brand-dark/58">{helper}</p>}
      {children}
    </div>
  );
}

function ErrorText({ text, isRtl }: { text?: string; isRtl: boolean }) {
  if (!text) return null;
  return <p className="type-small text-red-600">{localizeError(text, isRtl)}</p>;
}

function OptionGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-2", className)}>{children}</div>;
}

function OptionCard({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 type-small font-semibold transition",
        checked ? "border-brand-primary bg-brand-primary/10 text-brand-dark" : "border-brand-dark/15 bg-white text-brand-dark/78 hover:border-brand-dark/30"
      )}
    >
      {children}
    </label>
  );
}

function BinaryField({
  label,
  value,
  onChange,
  options,
  isRtl
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  isRtl: boolean;
}) {
  return (
    <Field label={label}>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
              value === option.value ? "border-brand-primary bg-brand-primary/10" : "border-brand-dark/15 hover:border-brand-dark/30"
            )}
          >
            <RadioGroupItem value={option.value} />
            <span className="type-small text-brand-dark/90">{isRtl ? option.ar : option.en}</span>
          </label>
        ))}
      </RadioGroup>
    </Field>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <dt className="type-small font-semibold text-brand-dark/70">{label}</dt>
      <dd className="type-small mt-1 text-brand-dark">{value}</dd>
    </div>
  );
}
