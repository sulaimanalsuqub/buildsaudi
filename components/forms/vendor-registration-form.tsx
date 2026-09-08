"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
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
  supplierCountries,
  textByLang,
} from "@/lib/vendor-options";
import { VendorErrorText, VendorTagInput } from "@/components/forms/vendor-form-shared";

type VendorRegistrationFormProps = {
  isRtl?: boolean;
};

/** Master Data — تُقرأ من Build-OPT وقت التحميل، لا تُكتب أو تُنشأ من الموقع إطلاقاً. id هو
 * الاسم العربي نفسه (مطابقة بالاسم لا برقم داخلي — نفس منطق Build-OPT). */
type MaterialCategory = { id: string; nameAr: string; nameEn: string };

// Prototype-only fallback. These values never reach the real registration API while mock mode is enabled.
const prototypeCategories: MaterialCategory[] = [
  { id: "الأدوات الصحية", nameAr: "الأدوات الصحية", nameEn: "Sanitaryware" },
  { id: "الكهرباء والإنارة", nameAr: "الكهرباء والإنارة", nameEn: "Electrical & Lighting" },
  { id: "السباكة وأنظمة الأنابيب", nameAr: "السباكة وأنظمة الأنابيب", nameEn: "Plumbing & Piping" },
  { id: "التكييف والتهوية", nameAr: "التكييف والتهوية", nameEn: "HVAC" },
  { id: "الأرضيات والجداريات", nameAr: "الأرضيات والجداريات", nameEn: "Flooring & Wall Finishes" },
  { id: "الدهانات والمواد المساعدة", nameAr: "الدهانات والمواد المساعدة", nameEn: "Paints & Adhesives" }
];

const formSchema = z.object({
  country: z.string().min(1, "required"),
  establishmentName: z.string().trim().min(2, "required"),
  contactName: z.string().trim().min(2, "required"),
  jobTitle: z.string().optional(),
  contactNumber: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  email: z.string().trim().email("invalidEmail"),
  businessType: z.string().min(1, "required"),
  categoryIds: z.array(z.string()).min(1, "required"),
  otherCategorySuggestion: z.string().max(200).optional(),
  brands: z.array(z.string()).refine((values) => values.every(isEnglishBrandName), "invalidEnglishBrand").optional(),
  shortDescription: z.string().optional(),
  website: z.string().optional(),
  catalogLink: z.string().optional(),
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
  catalogLink: "",
  privacyAccepted: false as unknown as true,
  termsAccepted: false as unknown as true,
};

export function VendorRegistrationForm({ isRtl = false }: VendorRegistrationFormProps) {
  const isPrototypeMode = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_MOCK === "true";
  const t = {
    formEyebrow: textByLang(isRtl, "Supplier qualification", "تأهيل الموردين"),
    formTitle: textByLang(isRtl, "Start your supplier application", "ابدأ طلب الانضمام"),
    formBody: textByLang(
      isRtl,
      "Submit your company details and product categories, and our operations team will review your application.",
      "أرسل بيانات منشأتك وفئات منتجاتك، وسيراجع فريق عمليات بيلد طلبكم."
    ),
    secureNote: textByLang(isRtl, "Reviewed by Build operations", "تتم المراجعة من فريق عمليات بيلد"),
    submitStateTitle: textByLang(isRtl, "Application Received", "تم استلام طلب الانضمام"),
    submitStateBody: textByLang(
      isRtl,
      "We received your application. Our team will review it and reach out if we need anything else.",
      "استلمنا طلبكم. سيراجعه فريقنا ويتواصل معكم إذا احتجنا أي معلومات إضافية."
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
      jobTitle: textByLang(isRtl, "Job Title (optional)", "المسمى الوظيفي (اختياري)"),
      contactNumber: textByLang(isRtl, "Mobile Number", "رقم الجوال"),
      email: textByLang(isRtl, "Email", "البريد الإلكتروني"),
      country: textByLang(isRtl, "Establishment Country", "بلد المنشأة"),
      businessType: textByLang(isRtl, "Business Type", "نوع النشاط التجاري"),
      categories: textByLang(isRtl, "Product Categories", "فئات المنتجات"),
      other: textByLang(isRtl, "Other (describe)", "أخرى (صف الفئة)"),
      brands: textByLang(isRtl, "Represented Brands in English (optional)", "العلامات التجارية بالإنجليزي (اختياري)"),
      shortDescription: textByLang(isRtl, "Brief description of your products (optional)", "وصف مختصر لمنتجاتكم (اختياري)"),
      website: textByLang(isRtl, "Website (optional)", "الموقع الإلكتروني (اختياري)"),
      catalogLink: textByLang(isRtl, "Catalog Link (optional)", "رابط الكتالوج (اختياري)"),
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
      categoriesLoading: textByLang(isRtl, "Loading categories…", "جاري تحميل الفئات…"),
      categoriesError: textByLang(isRtl, "Could not load categories. Please refresh the page.", "تعذر تحميل الفئات. أعد تحميل الصفحة."),
    },
    privacyLabel: textByLang(isRtl, "I agree to the Privacy Policy", "أوافق على سياسة الخصوصية"),
    termsLabel: textByLang(isRtl, "I agree to the Registration Terms", "أوافق على شروط التسجيل"),
    submit: textByLang(isRtl, "Submit Application", "إرسال طلب الانضمام"),
    prototypeNote: textByLang(isRtl, "Prototype mode: your details are not saved or sent.", "وضع تجريبي: بياناتك لا تُحفظ ولا تُرسل حالياً."),
    prototypeTitle: textByLang(isRtl, "Prototype submission complete", "تمت التجربة بنجاح"),
    prototypeBody: textByLang(isRtl, "The form flow is working in preview mode. Nothing was saved.", "تدفق النموذج يعمل في الوضع التجريبي. لم يتم حفظ أي بيانات."),
  };

  const [step, setStep] = useState(0);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState<"registered" | "already_registered" | "needs_review">("registered");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categories, setCategories] = useState<MaterialCategory[] | null>(null);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  // ربط الرد من ويدجت Turnstile بحالة الفورم عبر callback عام (النمط المتوافق مع سكربت Cloudflare)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).onVendorTurnstileVerified = (token: string) => setTurnstileToken(token);
    (window as unknown as Record<string, unknown>).onVendorTurnstileExpired = () => setTurnstileToken("");
    return () => {
      delete (window as unknown as Record<string, unknown>).onVendorTurnstileExpired;
      delete (window as unknown as Record<string, unknown>).onVendorTurnstileVerified;
    };
  }, []);

  // Fetch the live category catalog; the prototype fixture is never used for real submissions.
  useEffect(() => {
    if (isPrototypeMode) {
      setCategories(prototypeCategories);
      return;
    }
    setCategoriesFailed(false);
    setCategories(null);
    let cancelled = false;
    fetch("/api/reference/material-categories")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body?.ok && Array.isArray(body.categories) && body.categories.length > 0) {
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
  }, [isPrototypeMode, categoryAttempt]);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: "onChange" });
  const values = useWatch({ control: form.control, defaultValue: defaultValues });
  const isSaudi = isSaudiSupplierCountry(values.country || "sa");

  const focusStep = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  };
  const stepFields: (keyof FormValues)[][] = [["establishmentName", "country", "businessType"], ["categoryIds", "brands", "otherCategorySuggestion", "shortDescription", "website", "catalogLink"]];
  const nextStep = async () => {
    if (step === 1 && (!categories || categoriesFailed)) return;
    if (await form.trigger(stepFields[step], { shouldFocus: true })) focusStep(step + 1);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => form.handleSubmit(async (data) => {
    if (isLoading) return;
    if (!categories || categoriesFailed) { focusStep(1); return; }
    if (!isPrototypeMode && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setSubmitError(isRtl ? "يرجى إكمال التحقق الأمني أدناه" : "Please complete the security check below");
      return;
    }
    setSubmitError("");
    setIsLoading(true);
    if (isPrototypeMode) {
      await Promise.resolve();
      setResultStatus("registered");
      setIsSubmitted(true);
      setIsLoading(false);
      return;
    }
    try {
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
          category_names: data.categoryIds,
          other_category_suggestion: showOther ? data.otherCategorySuggestion?.trim() || undefined : undefined,
          brands: data.brands ?? [],
          short_description: data.shortDescription?.trim() || undefined,
          website: data.website?.trim() || undefined,
          catalog_link: data.catalogLink?.trim() || undefined,
          preferred_language: isRtl ? "ar" : "en",
          privacy_accepted: data.privacyAccepted,
          terms_accepted: data.termsAccepted,
          turnstile_token: turnstileToken,
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string; status?: string } | null;
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال الطلب");
      setResultStatus((result?.status as typeof resultStatus) ?? "registered");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : textByLang(isRtl, "Something went wrong.", "حدث خطأ."));
    } finally {
      setIsLoading(false);
    }
  }, (errors) => {
    const invalidStep = stepFields.findIndex((fields) => fields.some((field) => errors[field]));
    if (invalidStep >= 0) focusStep(invalidStep);
  })(event);

  if (isSubmitted) {
    const title = resultStatus === "needs_review" ? t.needsReviewTitle : resultStatus === "already_registered" ? t.alreadyRegisteredTitle : t.submitStateTitle;
    const body = resultStatus === "needs_review" ? t.needsReviewBody : resultStatus === "already_registered" ? t.alreadyRegisteredBody : t.submitStateBody;
    return (
      <section className="mx-auto max-w-5xl rounded-2xl border border-brand-primary/20 bg-white p-8 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="type-section-title mx-auto mt-5 text-brand-dark">{isPrototypeMode ? t.prototypeTitle : title}</h2>
        <p className="type-body mx-auto mt-4 max-w-lg text-brand-dark/80">{isPrototypeMode ? t.prototypeBody : body}</p>
        <a href={isRtl ? "/ar" : "/"} className="mt-8 inline-block rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          {isRtl ? "العودة للرئيسية" : "Back to Home"}
        </a>
      </section>
    );
  }

  const tr = (en: string, ar: string) => textByLang(isRtl, en, ar);
  const Forward = isRtl ? ArrowLeft : ArrowRight;
  const Back = isRtl ? ArrowRight : ArrowLeft;
  const inputClass = "h-12 rounded-lg text-base";
  const selectClass = "h-12 w-full rounded-lg border border-brand-dark/20 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-brand-primary/20";
  const stepLabels = [tr("Company", "المنشأة"), tr("Products", "المنتجات"), tr("Contact", "التواصل")];
  const stepTitles = [tr("Tell us about your company", "نبدأ بالتعرّف على منشأتك"), tr("What do you supply?", "وش المنتجات اللي تورّدها؟"), tr("Who should we contact?", "مع مين نتواصل؟")];
  const selectedCategories = values.categoryIds || [];
  const visibleCategories = (categories || []).filter((cat) => `${cat.nameAr} ${cat.nameEn}`.toLowerCase().includes(categorySearch.trim().toLowerCase()));
  const toggleCategory = (id: string) => form.setValue("categoryIds", selectedCategories.includes(id) ? selectedCategories.filter((c) => c !== id) : [...selectedCategories, id], { shouldValidate: true });
  const establishmentNameMatchesContact = !!values.contactName?.trim() && values.establishmentName?.trim().toLowerCase() === values.contactName.trim().toLowerCase();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" dir={isRtl ? "rtl" : "ltr"}>
      <form noValidate onSubmit={(event) => { if (step < 2) { event.preventDefault(); void nextStep(); } else { void onSubmit(event); } }} className="min-w-0 overflow-hidden rounded-xl border border-brand-dark/10 bg-white">
        <nav aria-label={tr("Registration steps", "خطوات التسجيل")} className="grid grid-cols-3 border-b border-brand-dark/10">
          {stepLabels.map((label, i) => <button key={label} type="button" disabled={isLoading || i > step} onClick={() => focusStep(i)} aria-current={step === i ? "step" : undefined} className={`flex min-h-20 items-center justify-center gap-2 border-b-2 px-2 py-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-primary ${step === i ? "border-brand-primary bg-brand-primary/[.04] text-brand-dark" : "border-transparent text-brand-dark/50"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${step >= i ? "bg-brand-dark text-white" : "border border-brand-dark/20"}`}>{step > i ? <Check className="h-4 w-4" aria-hidden="true" /> : `0${i + 1}`}</span>{label}</button>)}
        </nav>
        <fieldset disabled={isLoading} className="min-w-0 p-5 sm:p-8">
          <legend className="sr-only">{tr("Supplier application", "طلب انضمام مورد")}</legend>
          <div className="mb-7"><p className="mb-2 text-xs font-semibold text-brand-primary">{tr(`STEP 0${step + 1} OF 03`, `الخطوة 0${step + 1} من 03`)}</p><h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-2xl font-bold text-brand-dark outline-none">{stepTitles[step]}</h2><p className="mt-2 text-sm leading-6 text-brand-dark/60">{[tr("Your company name, location and business activity.", "اسم منشأتك، بلدها ونوع نشاطها."), tr("Select one or more categories that match your products.", "اختر فئة أو أكثر تناسب منتجات منشأتك."), tr("Add the responsible person’s details and review your application.", "أضف بيانات المسؤول وراجع طلبك قبل الإرسال.")][step]}</p></div>
          {isPrototypeMode && <p role="status" className="mb-5 rounded-lg bg-brand-light p-3 text-sm">{t.prototypeNote}</p>}

          <div hidden={step !== 0} className="space-y-5">
            <SupplierField id="vendor-company" label={t.labels.establishmentName}><Input id="vendor-company" {...form.register("establishmentName")} autoComplete="organization" className={inputClass} placeholder={tr("Legal name as shown on registration", "الاسم المسجل في السجل التجاري")} aria-invalid={!!form.formState.errors.establishmentName} /><VendorErrorText text={form.formState.errors.establishmentName?.message} isRtl={isRtl} /></SupplierField>
            <div className="grid gap-5 sm:grid-cols-2">
              <SupplierField id="vendor-country" label={t.labels.country}><select id="vendor-country" {...form.register("country")} className={selectClass}>{supplierCountries.map((c) => <option key={c.value} value={c.value}>{optionLabel(isRtl, supplierCountries, c.value)}</option>)}</select><VendorErrorText text={form.formState.errors.country?.message} isRtl={isRtl} /></SupplierField>
              <SupplierField id="vendor-business" label={t.labels.businessType}><select id="vendor-business" {...form.register("businessType")} aria-invalid={!!form.formState.errors.businessType} className={selectClass}><option value="">{tr("Choose business type", "اختر نوع النشاط")}</option>{businessTypes.map((b) => <option key={b.value} value={b.value}>{optionLabel(isRtl, businessTypes, b.value)}</option>)}</select><VendorErrorText text={form.formState.errors.businessType?.message} isRtl={isRtl} /></SupplierField>
            </div>
          </div>

          <div hidden={step !== 1} className="space-y-5">
            {categoriesFailed ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"><p>{tr("Could not load product categories. Your entered details are still here.", "تعذّر تحميل فئات المنتجات. بياناتك التي أدخلتها ما زالت محفوظة في النموذج.")}</p><button type="button" onClick={() => setCategoryAttempt((n) => n + 1)} className="mt-2 font-semibold underline">{tr("Try again", "إعادة المحاولة")}</button></div> : !categories ? <p role="status" className="flex items-center gap-2 py-8 text-sm text-brand-dark/60"><Loader2 className="h-4 w-4 animate-spin" />{t.helpers.categoriesLoading}</p> : <>
              <div className="relative"><Search className="pointer-events-none absolute start-3 top-4 h-4 w-4 text-brand-dark/45" aria-hidden="true" /><Input aria-label={tr("Search product categories", "البحث في فئات المنتجات")} value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder={tr("Search for a category…", "ابحث عن فئة منتجات…")} className={`${inputClass} ps-10`} /></div>
              <div className="flex items-center justify-between text-xs"><p className="font-semibold">{t.labels.categories}</p><p className="text-brand-primary" aria-live="polite">{tr(`${selectedCategories.length} selected`, `${selectedCategories.length} فئة محددة`)}</p></div>
              <div className="grid max-h-[340px] gap-2 overflow-y-auto p-1 sm:grid-cols-2">
                {visibleCategories.map((cat) => <label key={cat.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${selectedCategories.includes(cat.id) ? "border-brand-primary bg-brand-primary/5 font-semibold text-brand-dark" : "border-brand-dark/15 text-brand-dark/75 hover:border-brand-primary/50"}`}><input type="checkbox" className="h-4 w-4 shrink-0 accent-brand-primary" checked={selectedCategories.includes(cat.id)} onChange={() => toggleCategory(cat.id)} />{isRtl ? cat.nameAr : cat.nameEn}</label>)}
              </div>
              {visibleCategories.length === 0 && <p className="text-sm text-brand-dark/60">{tr("No matching categories. Try a different search.", "لا توجد فئات مطابقة. جرّب كلمة أخرى.")}</p>}
              <VendorErrorText text={form.formState.errors.categoryIds?.message} isRtl={isRtl} />
              <details><summary className="cursor-pointer text-sm font-medium text-brand-dark/65">{tr("Suggest another category (optional)", "اقتراح فئة إضافية (اختياري)")}</summary><div className="mt-3"><SupplierField id="vendor-other" label={tr("Suggested category", "الفئة المقترحة")}><Input id="vendor-other" maxLength={200} {...form.register("otherCategorySuggestion", { onChange: (event) => setShowOther(!!event.target.value.trim()) })} className={inputClass} /><p className="mt-2 text-xs leading-6 text-brand-dark/55">{tr("Also select at least one existing category that best fits your products.", "اختر أيضاً فئة واحدة على الأقل من القائمة الأقرب لمنتجاتك.")}</p></SupplierField></div></details>
            </>}
            <details className="border-t border-brand-dark/10 pt-5" open={form.formState.errors.brands ? true : undefined}><summary className="cursor-pointer text-sm font-semibold text-brand-dark">{tr("Brands, catalog & more (optional)", "العلامات والكتالوج وتفاصيل إضافية (اختياري)")}</summary><div className="mt-5 space-y-5">
              <div className="space-y-2"><p className="text-sm font-semibold">{t.labels.brands}</p><p className="text-xs text-brand-dark/55">{t.helpers.brands}</p><VendorTagInput values={values.brands || []} onChange={(next) => form.setValue("brands", next, { shouldValidate: true })} placeholder="Grohe" /><VendorErrorText text={form.formState.errors.brands?.message} isRtl={isRtl} /></div>
              <SupplierField id="vendor-description" label={t.labels.shortDescription}><textarea id="vendor-description" {...form.register("shortDescription")} className="min-h-24 w-full rounded-lg border border-brand-dark/20 p-3 text-base outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder={tr("Tell us more about what you supply", "عرّفنا أكثر بالمنتجات التي تورّدها")} /></SupplierField>
              <SupplierField id="vendor-catalog" label={t.labels.catalogLink}><Input id="vendor-catalog" {...form.register("catalogLink")} dir="ltr" className={inputClass} placeholder="https://" /></SupplierField>
              <SupplierField id="vendor-website" label={t.labels.website}><Input id="vendor-website" {...form.register("website")} dir="ltr" className={inputClass} placeholder="https://" /></SupplierField>
            </div></details>
          </div>

          <div hidden={step !== 2} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <SupplierField id="vendor-name" label={t.labels.contactName}><Input id="vendor-name" {...form.register("contactName")} autoComplete="name" aria-invalid={!!form.formState.errors.contactName} className={inputClass} placeholder={tr("Full name", "الاسم الكامل")} /><VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} /></SupplierField>
              <SupplierField id="vendor-phone" label={t.labels.contactNumber}><Input id="vendor-phone" {...form.register("contactNumber")} type="tel" autoComplete="tel" dir="ltr" aria-invalid={!!form.formState.errors.contactNumber} className={inputClass} placeholder={isSaudi ? "05XXXXXXXX" : "+971…"} /><VendorErrorText text={form.formState.errors.contactNumber?.message} isRtl={isRtl} /></SupplierField>
            </div>
            {establishmentNameMatchesContact && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">{t.helpers.establishmentNameMatchesContact}</p>}
            <SupplierField id="vendor-email" label={t.labels.email}><Input id="vendor-email" {...form.register("email")} type="email" autoComplete="email" dir="ltr" aria-invalid={!!form.formState.errors.email} className={inputClass} placeholder="name@company.com" /><VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} /></SupplierField>
            <SupplierField id="vendor-title" label={t.labels.jobTitle}><Input id="vendor-title" {...form.register("jobTitle")} autoComplete="organization-title" className={inputClass} /></SupplierField>
            <div className="rounded-lg bg-brand-light/70 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">{tr("Review your application", "مراجعة طلب الانضمام")}</h3><button type="button" onClick={() => focusStep(0)} className="text-xs font-semibold underline">{tr("Edit", "تعديل")}</button></div><p className="break-words text-sm font-semibold">{values.establishmentName}</p><p className="mt-1 text-sm leading-7 text-brand-dark/65">{optionLabel(isRtl, supplierCountries, values.country || "sa")} · {optionLabel(isRtl, businessTypes, values.businessType || "")}</p><div className="mt-3 flex flex-wrap gap-2">{selectedCategories.map((id) => <span key={id} className="rounded-md border border-brand-dark/10 bg-white px-2 py-1 text-xs">{isRtl ? categories?.find((cat) => cat.id === id)?.nameAr || id : categories?.find((cat) => cat.id === id)?.nameEn || id}</span>)}</div></div>
            <div className="space-y-3">
              <div><label className="flex cursor-pointer items-center gap-3 py-1 text-sm leading-6"><Checkbox checked={values.privacyAccepted} onCheckedChange={(v) => form.setValue("privacyAccepted", (v === true) as true, { shouldValidate: true })} /><span>{tr("I agree to the ", "أوافق على ")}<a href={isRtl ? "/ar/privacy-policy" : "/privacy-policy"} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{tr("Privacy Policy", "سياسة الخصوصية")}</a></span></label><VendorErrorText text={form.formState.errors.privacyAccepted?.message} isRtl={isRtl} /></div>
              <div><label className="flex cursor-pointer items-center gap-3 py-1 text-sm leading-6"><Checkbox checked={values.termsAccepted} onCheckedChange={(v) => form.setValue("termsAccepted", (v === true) as true, { shouldValidate: true })} /><span>{tr("I agree to the ", "أوافق على ")}<a href={isRtl ? "/ar/terms-conditions" : "/terms-conditions"} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{tr("Registration Terms", "شروط التسجيل")}</a></span></label><VendorErrorText text={form.formState.errors.termsAccepted?.message} isRtl={isRtl} /></div>
            </div>
          </div>
          {!isPrototypeMode && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <div hidden={step !== 2} className="mt-5"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /><div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onVendorTurnstileVerified" data-expired-callback="onVendorTurnstileExpired" data-error-callback="onVendorTurnstileExpired" data-language={isRtl ? "ar" : "en"} data-size="flexible" /></div>}
          <div className="mt-7 border-t border-brand-dark/10 pt-6">
            {submitError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</p>}
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? <button type="button" onClick={() => focusStep(step - 1)} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold"><Back className="h-4 w-4" />{tr("Back", "رجوع")}</button> : <p className="text-center text-xs text-brand-dark/55 sm:text-start">{tr("Next: your products", "التالي: منتجات منشأتك")}</p>}
              <Button type="submit" disabled={isLoading || (step === 1 && (!categories || categoriesFailed))} className="h-12 gap-3 rounded-lg px-7 text-sm sm:min-w-48">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{tr("Sending…", "جارٍ الإرسال…")}</> : <>{step === 2 ? t.submit : tr("Continue", "متابعة")}<Forward className="h-4 w-4" /></>}</Button>
            </div>
            {step === 2 && <p className="mt-4 text-center text-xs leading-6 text-brand-dark/55">{tr("Your application will be reviewed before joining the supplier network.", "يراجع فريقنا طلبك قبل الانضمام إلى شبكة الموردين.")}</p>}
          </div>
        </fieldset>
      </form>
      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="hidden rounded-xl bg-brand-dark p-6 text-white lg:block"><span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20"><Building2 className="h-5 w-5 text-brand-accent" aria-hidden="true" /></span><h2 className="text-lg font-bold">{tr("A place for your products", "مكان لمنتجاتك في شبكة بيلد")}</h2><p className="mt-3 text-sm leading-7 text-white/70">{tr("Start by introducing your company. We review your products and contact details to assess your application.", "البداية بالتعرّف على منشأتك. نراجع منتجاتك وبيانات التواصل لتقييم طلب الانضمام.")}</p><ol className="mt-6 space-y-4 border-t border-white/15 pt-5">{[tr("Submit your application", "ترسل طلب الانضمام"), tr("We review your details", "نراجع بيانات منشأتك"), tr("We contact you", "نتواصل معك للخطوة التالية")].map((label, i) => <li key={label} className="flex items-center gap-3 text-sm"><span className="text-xs text-brand-accent">0{i + 1}</span><span className="text-white/85">{label}</span></li>)}</ol></div>
        <div className="rounded-xl border border-brand-dark/10 bg-white/70 p-5"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-bold text-brand-dark"><Sparkles className="h-4 w-4 text-brand-primary" />BANI</p><button type="button" disabled className="cursor-not-allowed rounded-full bg-brand-accent/25 px-3 py-1 text-xs font-semibold text-brand-dark">{tr("Coming soon", "قريباً")}</button></div><p className="mt-3 text-sm font-semibold">{tr("Registration with BANI", "التسجيل بمساعدة باني")}</p><p className="mt-2 text-xs leading-6 text-brand-dark/60">{tr("A guided chat experience is on its way. You can register now using this form.", "تجربة تسجيل بالمحادثة نعمل على تجهيزها. تقدر تسجّل الآن من خلال النموذج.")}</p></div>
      </aside>
    </div>
  );
}

function SupplierField({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="min-w-0 space-y-2"><label htmlFor={id} className="block text-sm font-semibold text-brand-dark/85">{label}</label>{children}</div>;
}
