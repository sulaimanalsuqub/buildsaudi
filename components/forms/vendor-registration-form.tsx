"use client";

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
  textByLang,
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
    formEyebrow: textByLang(isRtl, "Supplier qualification", "تأهيل الموردين"),
    formTitle: textByLang(isRtl, "Start your supplier application", "ابدأ طلب الانضمام"),
    formBody: textByLang(
      isRtl,
      "Complete the Build supplier application form.",
      "قم بتعبئة نموذج الانضمام إلى موردي بيلد"
    ),
    secureNote: textByLang(isRtl, "Reviewed by Build operations", "تتم المراجعة من فريق عمليات بيلد"),
    submitStateTitle: textByLang(isRtl, "Application Received", "وصلنا طلب انضمامكم"),
    submitStateBody: textByLang(
      isRtl,
      "Thank you for choosing Build. We're pleased to learn about your products and look forward to working with you.",
      "شكرًا لثقتكم ببيلد. يسعدنا نتعرف على منتجاتكم ونتطلع للتعاون معكم."
    ),
    processingTitle: textByLang(isRtl, "Application Is Being Processed", "طلب الانضمام قيد المعالجة"),
    processingBody: textByLang(
      isRtl,
      "Your earlier submission is still being processed securely. Please do not submit it again; check your email shortly.",
      "طلبكم السابق ما زال يُعالج بشكل آمن. لا تعيدوا الإرسال؛ راقبوا البريد الإلكتروني خلال لحظات."
    ),
    needsReviewTitle: textByLang(isRtl, "Under Review", "قيد المراجعة"),
    needsReviewBody: textByLang(
      isRtl,
      "Some of your details match an existing application. Our team will review it and reach out if needed.",
      "بعض بياناتكم تتطابق مع طلب سابق لدينا. سيراجع فريقنا الطلب وسيتواصل معكم عند الحاجة."
    ),
    alreadyRegisteredTitle: textByLang(isRtl, "Already Registered", "مسجّل مسبقاً"),
    alreadyRegisteredBody: textByLang(
      isRtl,
      "We found an existing application for this establishment. No need to submit again — our team is already reviewing it.",
      "لدينا طلب مسجّل مسبقاً لهذه المنشأة. لا حاجة لإعادة الإرسال — فريقنا يراجعه حالياً."
    ),
    labels: {
      establishmentName: textByLang(isRtl, "Establishment / Company Name", "اسم المنشأة أو الشركة"),
      contactName: textByLang(isRtl, "Responsible Person", "المسؤول"),
      jobTitle: textByLang(isRtl, "Job Title", "المسمى الوظيفي"),
      contactNumber: textByLang(isRtl, "Mobile Number", "رقم الجوال"),
      email: textByLang(isRtl, "Email", "البريد الإلكتروني"),
      country: textByLang(isRtl, "Establishment Country", "بلد المنشأة"),
      businessType: textByLang(isRtl, "Business Type", "نوع النشاط التجاري"),
      categories: textByLang(isRtl, "Product Categories", "فئات المنتجات"),
      other: textByLang(isRtl, "Other (describe)", "أخرى (صف الفئة)"),
      brands: textByLang(isRtl, "Represented Brands in English", "العلامات التجارية بالإنجليزي"),
      shortDescription: textByLang(isRtl, "Brief description of your products", "وصف مختصر لمنتجاتكم"),
      website: textByLang(isRtl, "Website", "الموقع الإلكتروني"),
      supplierCurrency: textByLang(isRtl, "Supplier Currency", "عملة المورد"),
      paymentTerms: textByLang(isRtl, "Payment Terms", "شروط السداد"),
      paymentMethod: textByLang(isRtl, "Payment Method", "طريقة الدفع"),
      incoterm: textByLang(isRtl, "International Trade Terms", "شروط التجارة الدولية"),
      incotermLocation: textByLang(isRtl, "Incoterm Location", "موقع شروط التجارة الدولية"),
    },
    helpers: {
      establishmentName: textByLang(
        isRtl,
        "Use the legal name on your commercial registration — not your personal name.",
        "اكتب اسم النشاط التجاري من فضلك"
      ),
      establishmentNameMatchesContact: textByLang(
        isRtl,
        "This looks like a personal name. If you have a company/establishment name, use it here instead.",
        "هذا يبدو اسماً شخصياً. إذا كان لديكم اسم شركة أو منشأة، استخدموه هنا بدلاً من اسمكم الشخصي."
      ),
      brands: textByLang(isRtl, "Type the brand in English and press Enter.", "اكتب اسم العلامة بالإنجليزي واضغط Enter."),
      shortDescription: textByLang(isRtl, "You can leave this blank.", "يمكن ترك الحقل فارغًا"),
      categoriesLoading: textByLang(isRtl, "Loading categories…", "جاري تحميل الفئات…"),
      categoriesError: textByLang(
        isRtl,
        "Registration is temporarily down for maintenance. WhatsApp us at +966539927827 and we'll register you manually.",
        "التسجيل متوقف مؤقتًا للصيانة. راسلونا على واتساب 966539927827+ وسنسجّلكم يدويًا."
      ),
    },
    privacyLabel: textByLang(isRtl, "I agree to the Privacy Policy", "أوافق على سياسة الخصوصية"),
    termsLabel: textByLang(isRtl, "I agree to the Registration Terms", "أوافق على شروط التسجيل"),
    submit: textByLang(isRtl, "Submit Application", "إرسال طلب الانضمام"),
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
      setSubmitError(isRtl ? "يرجى إكمال التحقق الأمني أدناه" : "Please complete the security check below");
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
      if (files.length && !token) throw new Error(isRtl ? "تم حفظ الطلب، وتعذر بدء رفع الملفات. أعد المحاولة." : "Application saved; could not start uploads. Please retry.");
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
      if (failed) { setSubmitError(isRtl ? "تم حفظ طلب المورد، لكن تعذر رفع بعض الملفات. اضغط إرسال لإعادة محاولة الملفات المتبقية، أو احذفها وأكمل بدونها." : "Your application is saved, but some files failed. Submit again to retry remaining files, or remove them to finish without them."); return; }
      setIsSubmitted(true);
    } catch (error) {
      const base = error instanceof Error ? error.message : textByLang(isRtl, "Something went wrong.", "حدث خطأ.");
      setSubmitError(
        `${base} ${textByLang(isRtl, "— WhatsApp us at +966539927827 and we'll register you manually.", "— راسلونا على واتساب 966539927827+ وسنسجّلكم يدويًا.")}`
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
          {isRtl ? "العودة للرئيسية" : "Back to Home"}
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
        <p className="text-[15px] leading-6 text-brand-dark/60">{t.formBody}</p>
        <p className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-brand-dark/45">
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
            placeholder={isRtl ? "اكتب الاسم المسجل في السجل التجاري" : "Legal name as shown on registration"}
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
                  <option value="">{isRtl ? "اختر نوع النشاط" : "Select business type"}</option>
                  {businessTypes.map((b) => (
                    <option key={b.value} value={b.value}>
                      {optionLabel(isRtl, businessTypes, b.value)}
                    </option>
                  ))}
                </select>
                <VendorErrorText text={form.formState.errors.businessType?.message} isRtl={isRtl} />
              </VendorField>

              {!isSaudi && (
                <section className="space-y-5 rounded-2xl border border-brand-dark/10 bg-brand-light/40 p-5" aria-label={isRtl ? "بيانات المورد الدولي" : "International supplier details"}>
                  <div>
                    <p className="text-base font-bold text-brand-dark">{isRtl ? "بيانات المورد الدولي" : "International supplier details"}</p>
                    <p className="mt-1 text-sm leading-6 text-brand-dark/60">{isRtl ? "تظهر هذه الخيارات حسب البيانات المهيأة في أودو." : "These options are loaded from your Odoo setup."}</p>
                  </div>
                  {commercialOptionsFailed ? (
                    <p className="text-sm text-red-600">{isRtl ? "تعذر جلب خيارات المورد الدولي. أعد تحميل الصفحة." : "Could not load international supplier options. Please refresh."}</p>
                  ) : !commercialOptions ? (
                    <p className="text-sm text-brand-dark/50">{isRtl ? "جاري تحميل خيارات المورد الدولي…" : "Loading international supplier options…"}</p>
                  ) : (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <VendorField label={t.labels.supplierCurrency}>
                          <select {...form.register("supplierCurrencyId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{isRtl ? "اختر العملة" : "Choose currency"}</option>
                            {commercialOptions.currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.name} ({currency.symbol})</option>)}
                          </select>
                        </VendorField>
                        <VendorField label={t.labels.paymentTerms}>
                          <select {...form.register("supplierPaymentTermId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{isRtl ? "اختر شروط السداد" : "Choose payment terms"}</option>
                            {commercialOptions.paymentTerms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
                          </select>
                        </VendorField>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <VendorField label={t.labels.paymentMethod}>
                          <select {...form.register("supplierPaymentMethodLineId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{isRtl ? "اختر طريقة الدفع" : "Choose payment method"}</option>
                            {commercialOptions.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                          </select>
                        </VendorField>
                        <VendorField label={t.labels.incoterm}>
                          <select {...form.register("purchaseIncotermId")} className="h-14 w-full rounded-2xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">{isRtl ? "اختر شرط التجارة" : "Choose incoterm"}</option>
                            {commercialOptions.incoterms.map((incoterm) => <option key={incoterm.id} value={incoterm.id}>{incoterm.code} — {incoterm.name}</option>)}
                          </select>
                        </VendorField>
                      </div>
                      <VendorField label={t.labels.incotermLocation}>
                        <Input {...form.register("purchaseIncotermLocation")} className="h-14 rounded-2xl text-base" placeholder={isRtl ? "مثال: ميناء جدة الإسلامي" : "For example: Jeddah Islamic Port"} />
                      </VendorField>
                    </>
                  )}
                </section>
              )}

              <VendorField label={t.labels.categories}>
                {categoriesFailed ? (
                  <p className="text-sm text-red-600">{t.helpers.categoriesError}</p>
                ) : !categories ? (
                  <p className="text-sm text-brand-dark/50">{t.helpers.categoriesLoading}</p>
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
        <Button type="submit" size="lg" disabled={isLoading || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)} className="h-14 w-full rounded-2xl bg-brand-primary text-base hover:bg-brand-dark">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
        </Button>
        {submitError && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
      </div>
    </form>
  );
}
