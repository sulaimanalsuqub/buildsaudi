"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ClipboardCheck, Loader2, ShieldCheck } from "lucide-react";
import { EmailVerify } from "@/components/ui/email-verify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  isSaudiSupplierCountry,
  isValidVendorPhone,
  normalizeVendorPhone,
  optionLabel,
  parseVendorPhone,
  productCategories,
  supplierCountries,
  textByLang,
} from "@/lib/vendor-options";
import { VendorErrorText, VendorField, VendorOptionCard, VendorOptionGrid, VendorPhoneInput } from "@/components/forms/vendor-form-shared";

type VendorRegistrationFormProps = {
  isRtl?: boolean;
};

const formSchema = z.object({
  country: z.string().min(1, "required"),
  establishmentName: z.string().min(2, "required"),
  contactName: z.string().min(2, "required"),
  jobTitle: z.string().optional(),
  contactNumber: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  email: z.string().email("invalidEmail"),
  categories: z.array(z.string()).min(1, "required"),
  brands: z.string().optional(),
  shortDescription: z.string().min(5, "required"),
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
  categories: [],
  brands: "",
  shortDescription: "",
  website: "",
  catalogLink: "",
  privacyAccepted: false as unknown as true,
  termsAccepted: false as unknown as true,
};

export function VendorRegistrationForm({ isRtl = false }: VendorRegistrationFormProps) {
  const t = {
    formEyebrow: textByLang(isRtl, "Supplier qualification", "تأهيل الموردين"),
    formTitle: textByLang(isRtl, "Start your supplier application", "ابدأ طلب الانضمام"),
    formBody: textByLang(
      isRtl,
      "Submit your basic company details. After Build reviews and approves your request, you will receive a secure link to complete your full supply profile.",
      "أرسل بيانات منشأتك الأساسية. بعد مراجعة بيلد والموافقة، يصلكم رابط آمن لإكمال ملف التوريد الكامل."
    ),
    secureNote: textByLang(isRtl, "Reviewed by Build operations", "تتم المراجعة من فريق عمليات بيلد"),
    submitStateTitle: textByLang(isRtl, "Application Received", "تم استلام طلب الانضمام"),
    submitStateBody: textByLang(
      isRtl,
      "We received your basic details. After our initial review, you will get a link to complete your full supply profile. Final approval comes after we review your complete file and documents.",
      "استلمنا بياناتكم الأساسية. بعد المراجعة الأولية يصلكم رابط لإكمال ملف التوريد. الاعتماد النهائي بعد مراجعة الملف الكامل والمستندات."
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
      establishmentName: textByLang(isRtl, "Establishment Name", "اسم المنشأة"),
      contactName: textByLang(isRtl, "Responsible Person", "المسؤول"),
      jobTitle: textByLang(isRtl, "Job Title (optional)", "المسمى الوظيفي (اختياري)"),
      contactNumber: textByLang(isRtl, "Mobile Number", "رقم الجوال"),
      email: textByLang(isRtl, "Email", "البريد الإلكتروني"),
      country: textByLang(isRtl, "Establishment Country", "بلد المنشأة"),
      categories: textByLang(isRtl, "Product Categories", "فئات المنتجات"),
      brands: textByLang(isRtl, "Represented Brands (optional)", "العلامات التجارية الممثَّلة (اختياري)"),
      shortDescription: textByLang(isRtl, "Brief description of your products", "وصف مختصر لمنتجاتكم"),
      website: textByLang(isRtl, "Website (optional)", "الموقع الإلكتروني (اختياري)"),
      catalogLink: textByLang(isRtl, "Catalog Link (optional)", "رابط الكتالوج (اختياري)"),
    },
    helpers: {
      establishmentName: textByLang(isRtl, "Use the legal name shown on your commercial registration.", "اكتب الاسم النظامي كما يظهر في السجل التجاري."),
      brands: textByLang(isRtl, "Separate multiple brands with a comma.", "افصل بين العلامات التجارية بفاصلة."),
    },
    privacyLabel: textByLang(isRtl, "I agree to the Privacy Policy", "أوافق على سياسة الخصوصية"),
    termsLabel: textByLang(isRtl, "I agree to the Registration Terms", "أوافق على شروط التسجيل"),
    submit: textByLang(isRtl, "Submit Application", "إرسال طلب الانضمام"),
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState<"registered" | "already_registered" | "needs_review">("registered");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" });
  const values = form.watch();
  const isSaudi = isSaudiSupplierCountry(values.country);
  const emailVerified = !!verifiedEmail && verifiedEmail === values.email.trim().toLowerCase() && !!emailToken;

  const onSubmit = form.handleSubmit(async (data) => {
    if (!emailVerified) {
      form.setError("email", { message: "required" });
      setSubmitError(isRtl ? "يجب التحقق من البريد الإلكتروني أولاً" : "Please verify your email first");
      return;
    }
    setSubmitError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_name: data.establishmentName.trim(),
          country: data.country,
          supplier_type: isSaudi ? "local" : "international",
          contact_name: data.contactName.trim(),
          job_title: data.jobTitle?.trim() || undefined,
          email: data.email.trim().toLowerCase(),
          email_verified_token: emailToken,
          phone: normalizeVendorPhone(data.contactNumber),
          categories: data.categories,
          brands: data.brands
            ? data.brands
                .split(",")
                .map((b) => b.trim())
                .filter(Boolean)
            : [],
          short_description: data.shortDescription.trim(),
          website: data.website?.trim() || undefined,
          catalog_link: data.catalogLink?.trim() || undefined,
          preferred_language: isRtl ? "ar" : "en",
          privacy_accepted: data.privacyAccepted,
          terms_accepted: data.termsAccepted,
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
  });

  if (isSubmitted) {
    const title = resultStatus === "needs_review" ? t.needsReviewTitle : resultStatus === "already_registered" ? t.alreadyRegisteredTitle : t.submitStateTitle;
    const body = resultStatus === "needs_review" ? t.needsReviewBody : resultStatus === "already_registered" ? t.alreadyRegisteredBody : t.submitStateBody;
    return (
      <section className="mx-auto max-w-5xl rounded-2xl border border-brand-primary/20 bg-white p-8 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="type-section-title mx-auto mt-5 text-brand-dark">{title}</h2>
        <p className="type-body mx-auto mt-4 max-w-lg text-brand-dark/80">{body}</p>
        <a href={isRtl ? "/ar" : "/"} className="mt-8 inline-block rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          {isRtl ? "العودة للرئيسية" : "Back to Home"}
        </a>
      </section>
    );
  }

  const showContactName = values.establishmentName.trim().length >= 2;
  const showPhone = showContactName && values.contactName.trim().length >= 2;
  const phoneDigits = parseVendorPhone(values.contactNumber).localNumber;
  const showEmail = showPhone && phoneDigits.length >= 8;
  const showVerify = showEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) && !emailVerified;
  const showDetails = showEmail && emailVerified;

  const toggleCategory = (value: string) => {
    const current = values.categories;
    const next = current.includes(value) ? current.filter((c) => c !== value) : [...current, value];
    form.setValue("categories", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl rounded-2xl border border-brand-dark/10 bg-white p-5 md:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-8 space-y-4 border-b border-brand-dark/10 pb-6">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
          <ClipboardCheck className="h-4 w-4" />
          {t.formEyebrow}
        </p>
        <h2 className="text-2xl font-bold text-brand-dark md:text-3xl">{t.formTitle}</h2>
        <p className="max-w-2xl text-sm leading-7 text-brand-dark/65">{t.formBody}</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand-dark/70">
          <ShieldCheck className="h-4 w-4 text-brand-primary" />
          {t.secureNote}
        </div>
      </div>

      <div className="space-y-5">
        <VendorField label={t.labels.country}>
          <select
            value={values.country}
            onChange={(e) => form.setValue("country", e.target.value, { shouldValidate: true })}
            className="h-12 w-full rounded-xl border border-brand-dark/15 bg-white px-4 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          >
            {supplierCountries.map((c) => (
              <option key={c.value} value={c.value}>
                {optionLabel(isRtl, supplierCountries, c.value)}
              </option>
            ))}
          </select>
        </VendorField>

        <VendorField label={t.labels.establishmentName} helper={t.helpers.establishmentName}>
          <Input {...form.register("establishmentName")} autoComplete="organization" className="h-12 text-base" autoFocus />
          <VendorErrorText text={form.formState.errors.establishmentName?.message} isRtl={isRtl} />
        </VendorField>

        <AnimatePresence>
          {showContactName && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 sm:grid-cols-2">
              <VendorField label={t.labels.contactName}>
                <Input {...form.register("contactName")} className="h-12 text-base" />
                <VendorErrorText text={form.formState.errors.contactName?.message} isRtl={isRtl} />
              </VendorField>
              <VendorField label={t.labels.jobTitle}>
                <Input {...form.register("jobTitle")} className="h-12 text-base" />
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
          {showEmail && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <VendorField label={t.labels.email}>
                <Input
                  type="email"
                  {...form.register("email", {
                    onChange: () => {
                      if (emailVerified) {
                        setVerifiedEmail("");
                        setEmailToken("");
                      }
                    },
                  })}
                  className="h-12 text-base"
                  dir="ltr"
                />
                <VendorErrorText text={form.formState.errors.email?.message} isRtl={isRtl} />
              </VendorField>
              {emailVerified ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {isRtl ? "تم التحقق من البريد ✓" : "Email verified ✓"}
                </div>
              ) : showVerify ? (
                <EmailVerify
                  email={values.email.trim()}
                  isRtl={isRtl}
                  onVerified={(token) => {
                    setVerifiedEmail(values.email.trim().toLowerCase());
                    setEmailToken(token);
                    form.clearErrors("email");
                  }}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <VendorField label={t.labels.categories}>
                <VendorOptionGrid>
                  {productCategories.map((cat) => (
                    <VendorOptionCard key={cat.value} checked={values.categories.includes(cat.value)}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-primary"
                        checked={values.categories.includes(cat.value)}
                        onChange={() => toggleCategory(cat.value)}
                      />
                      {optionLabel(isRtl, productCategories, cat.value)}
                    </VendorOptionCard>
                  ))}
                </VendorOptionGrid>
                <VendorErrorText text={form.formState.errors.categories?.message} isRtl={isRtl} />
              </VendorField>

              <VendorField label={t.labels.brands} helper={t.helpers.brands}>
                <Input {...form.register("brands")} className="h-12 text-base" />
              </VendorField>

              <VendorField label={t.labels.shortDescription}>
                <textarea
                  {...form.register("shortDescription")}
                  className="min-h-[96px] w-full rounded-xl border border-brand-dark/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
                <VendorErrorText text={form.formState.errors.shortDescription?.message} isRtl={isRtl} />
              </VendorField>

              <div className="grid gap-5 sm:grid-cols-2">
                <VendorField label={t.labels.website}>
                  <Input {...form.register("website")} dir="ltr" className="h-12 text-base" />
                </VendorField>
                <VendorField label={t.labels.catalogLink}>
                  <Input {...form.register("catalogLink")} dir="ltr" className="h-12 text-base" />
                </VendorField>
              </div>

              <div className="space-y-3 rounded-xl bg-brand-light/40 p-4">
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

      <div className="mt-8 border-t border-brand-dark/10 pt-6">
        <Button type="submit" size="lg" disabled={isLoading || !showDetails} className="w-full rounded-full bg-brand-primary hover:bg-brand-dark sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
        </Button>
        {submitError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
      </div>
    </form>
  );
}
