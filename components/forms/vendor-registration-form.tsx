"use client";
import { interfaceCopy } from "@/lib/dictionaries/interface";


import { useEffect, useState } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  businessTypes,
  isEnglishBrandName,
  isSaudiSupplierCountry,
  isValidVendorPhone,
  normalizeVendorPhone,
  optionLabel,
  parseVendorPhone,
  supplierCountries,
} from "@/lib/vendor-options";
import { VendorErrorText, VendorField, VendorOptionCard, VendorOptionGrid, VendorPhoneInput, VendorTagInput } from "@/components/forms/vendor-form-shared";
import { VendorRegistrationFiles, type SelectedVendorFile } from "@/components/forms/vendor-registration-files";

type VendorRegistrationFormProps = {
  isRtl?: boolean;
};

/** Master Data — تُقرأ من Odoo وقت التحميل، لا تُكتب أو تُنشأ من الموقع إطلاقاً */
type MaterialCategory = { id: string; nameAr: string; nameEn: string };
type VendorCommercialOptions = {
  currencies: { id: number; name: string; symbol: string }[];
  paymentTerms: { id: number; name: string }[];
  paymentMethods: { id: number; name: string }[];
  incoterms: { id: number; code: string; name: string }[];
};

const formSchema = z.object({
  country: z.string().min(1, "required"),
  establishmentName: z.string().min(2, "required"),
  contactName: z.string().min(2, "required"),
  jobTitle: z.string().optional(),
  contactNumber: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  email: z.string().email("invalidEmail"),
  businessType: z.string().min(1, "required"),
  categoryIds: z.array(z.string()).min(1, "required"),
  otherCategorySuggestion: z.string().optional(),
  brands: z.array(z.string()).refine((values) => values.every(isEnglishBrandName), "invalidEnglishBrand").optional(),
  shortDescription: z.string(),
  website: z.string().optional(),
  supplierCurrencyId: z.string().optional(),
  supplierPaymentTermId: z.string().optional(),
  supplierPaymentMethodLineId: z.string().optional(),
  purchaseIncotermId: z.string().optional(),
  purchaseIncotermLocation: z.string().max(200).optional(),
  privacyAccepted: z.literal(true, { message: "required" }),
  termsAccepted: z.literal(true, { message: "required" }),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  country: "sa",
  establishmentName: "",
  contactName: "",
  jobTitle: "",
  contactNumber: "",
  email: "",
  businessType: "",
  categoryIds: [],
  otherCategorySuggestion: "",
  brands: [],
  shortDescription: "",
  website: "",
  supplierCurrencyId: "",
  supplierPaymentTermId: "",
  supplierPaymentMethodLineId: "",
  purchaseIncotermId: "",
  purchaseIncotermLocation: "",
  privacyAccepted: false as unknown as true,
  termsAccepted: false as unknown as true,
};

export function VendorRegistrationForm({ isRtl = false }: VendorRegistrationFormProps) {
  const [files, setFiles] = useState<SelectedVendorFile[]>([]);
  const [uploadToken, setUploadToken] = useState("");
  // يبقى ثابتاً طوال محاولة التسجيل، لذلك إعادة إرسال الطلب بعد مهلة الشبكة لا تنشئ مورداً ثانياً.
  const [submissionId] = useState(() => crypto.randomUUID());
  const t = {
    formEyebrow: interfaceCopy(isRtl, "vendor_registration_form_001"),
    formTitle: interfaceCopy(isRtl, "vendor_registration_form_002"),
    formBody: interfaceCopy(isRtl, "vendor_registration_form_003"),
    secureNote: interfaceCopy(isRtl, "vendor_registration_form_004"),
    submitStateTitle: interfaceCopy(isRtl, "vendor_registration_form_005"),
    submitStateBody: interfaceCopy(isRtl, "vendor_registration_form_006"),
    processingTitle: interfaceCopy(isRtl, "vendor_registration_form_007"),
    processingBody: interfaceCopy(isRtl, "vendor_registration_form_008"),
    needsReviewTitle: interfaceCopy(isRtl, "vendor_registration_form_009"),
    needsReviewBody: interfaceCopy(isRtl, "vendor_registration_form_010"),
    alreadyRegisteredTitle: interfaceCopy(isRtl, "vendor_registration_form_011"),
    alreadyRegisteredBody: interfaceCopy(isRtl, "vendor_registration_form_012"),
    labels: {
      establishmentName: interfaceCopy(isRtl, "vendor_registration_form_013"),
      contactName: interfaceCopy(isRtl, "vendor_registration_form_014"),
      jobTitle: interfaceCopy(isRtl, "vendor_registration_form_015"),
      contactNumber: interfaceCopy(isRtl, "vendor_registration_form_016"),
      email: interfaceCopy(isRtl, "vendor_registration_form_017"),
      country: interfaceCopy(isRtl, "vendor_registration_form_018"),
      businessType: interfaceCopy(isRtl, "vendor_registration_form_019"),
      categories: interfaceCopy(isRtl, "vendor_registration_form_020"),
      other: interfaceCopy(isRtl, "vendor_registration_form_021"),
      brands: interfaceCopy(isRtl, "vendor_registration_form_022"),
      shortDescription: interfaceCopy(isRtl, "vendor_registration_form_023"),
      website: interfaceCopy(isRtl, "vendor_registration_form_024"),
      supplierCurrency: interfaceCopy(isRtl, "vendor_registration_form_025"),
      paymentTerms: interfaceCopy(isRtl, "vendor_registration_form_026"),
      paymentMethod: interfaceCopy(isRtl, "vendor_registration_form_027"),
      incoterm: interfaceCopy(isRtl, "vendor_registration_form_028"),
      incotermLocation: interfaceCopy(isRtl, "vendor_registration_form_029"),
    },
    helpers: {
      establishmentName: interfaceCopy(isRtl, "vendor_registration_form_030"),
      establishmentNameMatchesContact: interfaceCopy(isRtl, "vendor_registration_form_031"),
      brands: interfaceCopy(isRtl, "vendor_registration_form_032"),
      shortDescription: interfaceCopy(isRtl, "vendor_registration_form_033"),
      categoriesLoading: interfaceCopy(isRtl, "vendor_registration_form_034"),
      categoriesError: interfaceCopy(isRtl, "vendor_registration_form_035"),
    },
    privacyLabel: interfaceCopy(isRtl, "vendor_registration_form_036"),
    termsLabel: interfaceCopy(isRtl, "vendor_registration_form_037"),
    submit: interfaceCopy(isRtl, "vendor_registration_form_038"),
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState<"registered" | "already_registered" | "needs_review" | "processing">("registered");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categories, setCategories] = useState<MaterialCategory[] | null>(null);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [commercialOptions, setCommercialOptions] = useState<VendorCommercialOptions | null>(null);
  const [commercialOptionsFailed, setCommercialOptionsFailed] = useState(false);

  // ربط الرد من ويدجت Turnstile بحالة الفورم عبر callback عام (النمط المتوافق مع سكربت Cloudflare)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).onVendorTurnstileVerified = (token: string) => setTurnstileToken(token);
    return () => {
      delete (window as unknown as Record<string, unknown>).onVendorTurnstileVerified;
    };
  }, []);

  // الفئات Master Data تُقرأ من Odoo فقط — لا قائمة محلية ثابتة
  useEffect(() => {
    let cancelled = false;
    fetch("/api/reference/material-categories")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body?.ok && Array.isArray(body.categories)) {
          setCategories(body.categories);
        } else {
          setCategoriesFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoriesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" });
  const values = form.watch();
  const isSaudi = isSaudiSupplierCountry(values.country);
  useEffect(() => {
    if (isSaudi) return;
    let cancelled = false;
    setCommercialOptionsFailed(false);
    fetch(`/api/reference/vendor-commercial-options?lang=${isRtl ? "ar" : "en"}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body?.ok) setCommercialOptions(body as VendorCommercialOptions);
        else if (!cancelled) setCommercialOptionsFailed(true);
      })
      .catch(() => { if (!cancelled) setCommercialOptionsFailed(true); });
    return () => { cancelled = true; };
  }, [isSaudi, isRtl]);
  const onSubmit = form.handleSubmit(async (data) => {
    if (!uploadToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setSubmitError(interfaceCopy(isRtl, "vendor_registration_form_039"));
      return;
    }
    setSubmitError("");
    setIsLoading(true);
    try {
      let token = uploadToken;
      if (!token) {
      const manifest = await Promise.all(files.map(async ({ file }) => ({ name: file.name, size: file.size, type: file.type,
        sha256: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))).map(b => b.toString(16).padStart(2, "0")).join(""),
      })));
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_name: data.establishmentName.trim(),
          // نرسل الاسم المعروض لا الرمز الداخلي (مثال: "السعودية" وليس "sa")
          country: optionLabel(true, supplierCountries, data.country),
          supplier_type: isSaudi ? "local" : "international",
          business_type: data.businessType,
          contact_name: data.contactName.trim(),
          job_title: data.jobTitle?.trim() || undefined,
          email: data.email.trim().toLowerCase(),
          phone: normalizeVendorPhone(data.contactNumber),
          category_names: data.categoryIds
            .map((id) => categories?.find((c) => c.id === id)?.nameAr)
            .filter((name): name is string => !!name),
          other_category_suggestion: showOther ? data.otherCategorySuggestion?.trim() || undefined : undefined,
          brands: data.brands ?? [],
          short_description: data.shortDescription.trim(),
          website: data.website?.trim() || undefined,
          files: manifest,
          supplier_currency_id: !isSaudi && data.supplierCurrencyId ? Number(data.supplierCurrencyId) : undefined,
          supplier_payment_term_id: !isSaudi && data.supplierPaymentTermId ? Number(data.supplierPaymentTermId) : undefined,
          supplier_payment_method_line_id: !isSaudi && data.supplierPaymentMethodLineId ? Number(data.supplierPaymentMethodLineId) : undefined,
          purchase_incoterm_id: !isSaudi && data.purchaseIncotermId ? Number(data.purchaseIncotermId) : undefined,
          purchase_incoterm_location: !isSaudi ? data.purchaseIncotermLocation?.trim() || undefined : undefined,
          preferred_language: isRtl ? "ar" : "en",
          submission_id: submissionId,
          privacy_accepted: data.privacyAccepted,
          terms_accepted: data.termsAccepted,
          turnstile_token: turnstileToken,
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string; status?: string; uploadToken?: string } | null;
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال الطلب");
      setResultStatus((result?.status as typeof resultStatus) ?? "registered");
      token = result?.uploadToken || "";
      setUploadToken(token);
      if (files.length && !token) throw new Error(interfaceCopy(isRtl, "vendor_registration_form_040"));
      }
      let failed = false;
      for (const item of files.filter(f => f.status !== "uploaded")) {
        setFiles(current => current.map(f => f.id === item.id ? { ...f, status: "uploading", error: undefined } : f));
        try {
          const body = new FormData(); body.append("token", token); body.append("file", item.file);
          const response = await fetch("/api/vendors/registration-files", { method: "POST", body });
          const result = await response.json().catch(() => null);
          if (response.status === 403) setUploadToken("");
          if (!response.ok || !result?.ok) throw new Error(isRtl ? (result?.error || "تعذر رفع الملف. أعد المحاولة.") : "Upload failed. Check the file and retry.");
          setFiles(current => current.map(f => f.id === item.id ? { ...f, status: "uploaded" } : f));
        } catch (error) {
          failed = true;
          setFiles(current => current.map(f => f.id === item.id ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : f));
        }
      }
      if (failed) { setSubmitError(interfaceCopy(isRtl, "vendor_registration_form_041")); return; }
      setIsSubmitted(true);
    } catch (error) {
      const base = error instanceof Error ? error.message : interfaceCopy(isRtl, "vendor_registration_form_042");
      setSubmitError(
        `${base} ${interfaceCopy(isRtl, "vendor_registration_form_043")}`
      );
    } finally {
      setIsLoading(false);
    }
  });

  if (isSubmitted) {
    const title = resultStatus === "processing" ? t.processingTitle : resultStatus === "needs_review" ? t.needsReviewTitle : resultStatus === "already_registered" ? t.alreadyRegisteredTitle : t.submitStateTitle;
    const body = resultStatus === "processing" ? t.processingBody : resultStatus === "needs_review" ? t.needsReviewBody : resultStatus === "already_registered" ? t.alreadyRegisteredBody : t.submitStateBody;
    return (
      <section className="w-full rounded-3xl bg-brand-light/40 p-8 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="type-section-title mx-auto mt-5 text-brand-dark">{title}</h2>
        <p className="type-body mx-auto mt-4 max-w-lg text-brand-dark/80">{body}</p>
        <a href={isRtl ? "/ar" : "/"} className="mt-8 inline-block rounded-2xl bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          {interfaceCopy(isRtl, "vendor_registration_form_044")}
        </a>
      </section>
    );
  }

  const showContactName = values.establishmentName.trim().length >= 2;
  const showPhone = showContactName && values.contactName.trim().length >= 2;
  const phoneDigits = parseVendorPhone(values.contactNumber).localNumber;
  const showDetails = showPhone && phoneDigits.length >= 8;
  // تنبيه لطيف (لا يمنع الإرسال) — تكرار شائع: كتابة الاسم الشخصي في حقل اسم المنشأة
  const establishmentNameMatchesContact =
    showContactName &&
    values.contactName.trim().length >= 2 &&
    values.establishmentName.trim().toLowerCase() === values.contactName.trim().toLowerCase();

  const toggleCategory = (id: string) => {
    const current = values.categoryIds;
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    form.setValue("categoryIds", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="w-full" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-8 space-y-3">
        <h1 className="text-[28px] font-bold leading-tight text-brand-dark md:text-[32px]">{t.formTitle}</h1>
        <p className="text-[15px] leading-6 text-brand-dark/70">{t.formBody}</p>
        <p className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-brand-dark/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t.secureNote}
        </p>
      </div>

      <div className="space-y-5">
        <VendorField label={t.labels.country}>
          <select
            value={values.country}
            onChange={(e) => form.setValue("country", e.target.value, { shouldValidate: true })}
            className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          >
            {supplierCountries.map((c) => (
              <option key={c.value} value={c.value}>
                {optionLabel(isRtl, supplierCountries, c.value)}
              </option>
            ))}
          </select>
        </VendorField>

        <VendorField label={t.labels.establishmentName} helper={t.helpers.establishmentName}>
          <Input
            {...form.register("establishmentName")}
            autoComplete="organization"
            className="h-14 rounded-2xl text-base"
            autoFocus
            placeholder={interfaceCopy(isRtl, "vendor_registration_form_045")}
          />
          <VendorErrorText text={form.formState.errors.establishmentName?.message} isRtl={isRtl} />
          {establishmentNameMatchesContact && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {t.helpers.establishmentNameMatchesContact}
            </p>
          )}
        </VendorField>

        <AnimatePresence>
          {showContactName && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 sm:grid-cols-2">
              <VendorField label={t.labels.contactName}>
                <Input {...form.register("contactName")} className="h-14 rounded-2xl text-base" />
                <VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} />
              </VendorField>
              <VendorField label={t.labels.jobTitle}>
                <Input {...form.register("jobTitle")} className="h-14 rounded-2xl text-base" />
              </VendorField>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPhone && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <VendorField label={t.labels.contactNumber}>
                <VendorPhoneInput
                  value={values.contactNumber}
                  onChange={(v) => form.setValue("contactNumber", v, { shouldValidate: true })}
                  isRtl={isRtl}
                  hasError={!!form.formState.errors.contactNumber}
                />
                <VendorErrorText text={form.formState.errors.contactNumber?.message} isRtl={isRtl} />
              </VendorField>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <VendorField label={t.labels.businessType}>
                <select
                  value={values.businessType}
                  onChange={(e) => form.setValue("businessType", e.target.value, { shouldValidate: true })}
                  className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">{interfaceCopy(isRtl, "vendor_registration_form_046")}</option>
                  {businessTypes.map((b) => (
                    <option key={b.value} value={b.value}>
                      {optionLabel(isRtl, businessTypes, b.value)}
                    </option>
                  ))}
                </select>
                <VendorErrorText text={form.formState.errors.businessType?.message} isRtl={isRtl} />
              </VendorField>

              {!isSaudi && (
                <section className="space-y-5 rounded-2xl border border-brand-dark/10 bg-brand-light/40 p-5" aria-label={interfaceCopy(isRtl, "vendor_registration_form_047")}>
                  <div>
                    <p className="text-base font-bold text-brand-dark">{interfaceCopy(isRtl, "vendor_registration_form_048")}</p>
                    <p className="mt-1 text-sm leading-6 text-brand-dark/70">{interfaceCopy(isRtl, "vendor_registration_form_049")}</p>
                  </div>
                  {commercialOptionsFailed ? (
                    <p className="text-sm text-red-600">{interfaceCopy(isRtl, "vendor_registration_form_050")}</p>
                  ) : !commercialOptions ? (
                    <p className="text-sm text-brand-dark/70">{interfaceCopy(isRtl, "vendor_registration_form_051")}</p>
                  ) : (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <VendorField label={t.labels.supplierCurrency}>
                          <select {...form.register("supplierCurrencyId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{interfaceCopy(isRtl, "vendor_registration_form_052")}</option>
                            {commercialOptions.currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.name} ({currency.symbol})</option>)}
                          </select>
                        </VendorField>
                        <VendorField label={t.labels.paymentTerms}>
                          <select {...form.register("supplierPaymentTermId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{interfaceCopy(isRtl, "vendor_registration_form_053")}</option>
                            {commercialOptions.paymentTerms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
                          </select>
                        </VendorField>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <VendorField label={t.labels.paymentMethod}>
                          <select {...form.register("supplierPaymentMethodLineId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{interfaceCopy(isRtl, "vendor_registration_form_054")}</option>
                            {commercialOptions.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                          </select>
                        </VendorField>
                        <VendorField label={t.labels.incoterm}>
                          <select {...form.register("purchaseIncotermId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{interfaceCopy(isRtl, "vendor_registration_form_055")}</option>
                            {commercialOptions.incoterms.map((incoterm) => <option key={incoterm.id} value={incoterm.id}>{incoterm.code} — {incoterm.name}</option>)}
                          </select>
                        </VendorField>
                      </div>
                      <VendorField label={t.labels.incotermLocation}>
                        <Input {...form.register("purchaseIncotermLocation")} className="h-14 rounded-2xl text-base" placeholder={interfaceCopy(isRtl, "vendor_registration_form_056")} />
                      </VendorField>
                    </>
                  )}
                </section>
              )}

              <VendorField label={t.labels.categories}>
                {categoriesFailed ? (
                  <p className="text-sm text-red-600">{t.helpers.categoriesError}</p>
                ) : !categories ? (
                  <p className="text-sm text-brand-dark/70">{t.helpers.categoriesLoading}</p>
                ) : (
                  <>
                    <VendorOptionGrid>
                      {categories.map((cat) => (
                        <VendorOptionCard key={cat.id} checked={values.categoryIds.includes(cat.id)}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-primary"
                            checked={values.categoryIds.includes(cat.id)}
                            onChange={() => toggleCategory(cat.id)}
                          />
                          {isRtl ? cat.nameAr : cat.nameEn}
                        </VendorOptionCard>
                      ))}
                      <VendorOptionCard checked={showOther}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-primary"
                          checked={showOther}
                          onChange={() => setShowOther((s) => !s)}
                        />
                        {t.labels.other}
                      </VendorOptionCard>
                    </VendorOptionGrid>
                    {showOther && (
                      <Input
                        {...form.register("otherCategorySuggestion")}
                        className="mt-3 h-14 rounded-2xl text-base"
                        placeholder={t.labels.other}
                      />
                    )}
                  </>
                )}
                <VendorErrorText text={form.formState.errors.categoryIds?.message} isRtl={isRtl} />
              </VendorField>

              <VendorField label={t.labels.brands} helper={t.helpers.brands}>
                <VendorTagInput
                  values={values.brands ?? []}
                  onChange={(next) => form.setValue("brands", next, { shouldValidate: true })}
                  placeholder="Grohe"
                />
                <VendorErrorText text={form.formState.errors.brands?.message} isRtl={isRtl} />
              </VendorField>

              <VendorField label={t.labels.shortDescription} helper={t.helpers.shortDescription}>
                <textarea
                  {...form.register("shortDescription")}
                  className="min-h-[110px] w-full rounded-2xl border border-brand-dark/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
                <VendorErrorText text={form.formState.errors.shortDescription?.message} isRtl={isRtl} />
              </VendorField>

              <div className="space-y-5">
                <VendorField label={t.labels.website}>
                  <Input {...form.register("website")} dir="ltr" className="h-14 rounded-2xl text-base" />
                </VendorField>
                <VendorRegistrationFiles files={files} onChange={setFiles} isRtl={isRtl} busy={isLoading} locked={!!uploadToken} />
              </div>

              <div className="space-y-3">
                <VendorField label={t.labels.email}>
                  <Input type="email" {...form.register("email")} className="h-14 rounded-2xl text-base" dir="ltr" />
                  <VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} />
                </VendorField>
              </div>

              <div className="space-y-3 rounded-2xl bg-brand-light/40 p-4">
                <label className="flex items-start gap-3 text-sm text-brand-dark/85">
                  <Checkbox
                    checked={values.privacyAccepted}
                    onCheckedChange={(v) => form.setValue("privacyAccepted", (v === true) as true, { shouldValidate: true })}
                  />
                  {t.privacyLabel}
                </label>
                <label className="flex items-start gap-3 text-sm text-brand-dark/85">
                  <Checkbox
                    checked={values.termsAccepted}
                    onCheckedChange={(v) => form.setValue("termsAccepted", (v === true) as true, { shouldValidate: true })}
                  />
                  {t.termsLabel}
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="mt-6">
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-callback="onVendorTurnstileVerified"
            data-language={isRtl ? "ar" : "en"}
          />
        </div>
      )}

      <div className="mt-8 border-t border-brand-dark/10 pt-6">
        <Button type="submit" size="lg" disabled={isLoading || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)} className="h-14 w-full rounded-2xl text-base ">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
        </Button>
        {submitError && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
      </div>
    </form>
  );
}
