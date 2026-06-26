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
import { crNumberRegex, isValidVendorPhone, normalizeVendorPhone, textByLang } from "@/lib/vendor-options";
import { VendorErrorText, VendorField } from "@/components/forms/vendor-form-shared";

type VendorRegistrationFormProps = {
  isRtl?: boolean;
};

const formSchema = z.object({
  establishmentName: z.string().min(2, "required"),
  managerName: z.string().min(2, "required"),
  contactNumber: z.string().min(1, "required").refine(isValidVendorPhone, { message: "invalidPhone" }),
  email: z.string().email("invalidEmail"),
  crNumber: z.string().regex(crNumberRegex, "invalidCR"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  establishmentName: "",
  managerName: "",
  contactNumber: "",
  email: "",
  crNumber: "",
};

export function VendorRegistrationForm({ isRtl = false }: VendorRegistrationFormProps) {
  const t = {
    formEyebrow: textByLang(isRtl, "Supplier qualification", "تأهيل الموردين"),
    formTitle: textByLang(isRtl, "Start your supplier application", "ابدأ طلب الانضمام"),
    formBody: textByLang(
      isRtl,
      "Submit your basic company details. After Build reviews and approves your request, you will receive a link to complete your full supply profile.",
      "أرسل بيانات منشأتك الأساسية. بعد مراجعة بيلد والموافقة، يصلكم رابط لإكمال ملف التوريد الكامل."
    ),
    secureNote: textByLang(isRtl, "Reviewed by Build operations", "تتم المراجعة من فريق عمليات بيلد"),
    submitStateTitle: textByLang(isRtl, "Application Received", "تم استلام طلب الانضمام"),
    submitStateBody: textByLang(
      isRtl,
      "We received your basic details. After our initial review, you will get a link to complete your full supply profile. Final approval comes after we review your complete file and documents.",
      "استلمنا بياناتكم الأساسية. بعد المراجعة الأولية يصلكم رابط لإكمال ملف التوريد. الاعتماد النهائي بعد مراجعة الملف الكامل والمستندات."
    ),
    labels: {
      establishmentName: textByLang(isRtl, "Establishment Name", "اسم المنشأة"),
      managerName: textByLang(isRtl, "Responsible Person", "المسؤول"),
      contactNumber: textByLang(isRtl, "Contact Number", "رقم التواصل"),
      email: textByLang(isRtl, "Email", "البريد الإلكتروني"),
      crNumber: textByLang(isRtl, "Commercial Registration Number", "رقم السجل"),
    },
    helpers: {
      establishmentName: textByLang(isRtl, "Use the legal name shown on your commercial registration.", "اكتب الاسم النظامي كما يظهر في السجل التجاري."),
      contactNumber: textByLang(
        isRtl,
        "Saudi: 05xxxxxxxx — International: +country code (e.g. +971501234567)",
        "سعودي: 05xxxxxxxx — دولي: +رمز الدولة (مثال: +971501234567)"
      ),
    },
    submit: textByLang(isRtl, "Submit Application", "إرسال طلب الانضمام"),
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" });
  const values = form.watch();
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
          manager_name: data.managerName.trim(),
          contact_number: normalizeVendorPhone(data.contactNumber),
          email: data.email.trim().toLowerCase(),
          email_verified_token: emailToken,
          cr_number: data.crNumber.replace(/\D/g, ""),
        }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(result?.error ?? "تعذر إرسال الطلب");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : textByLang(isRtl, "Something went wrong.", "حدث خطأ."));
    } finally {
      setIsLoading(false);
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
        <a href={isRtl ? "/ar" : "/"} className="mt-8 inline-block rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          {isRtl ? "العودة للرئيسية" : "Back to Home"}
        </a>
      </section>
    );
  }

  const showManager = values.establishmentName.trim().length >= 2;
  const showPhone = showManager && values.managerName.trim().length >= 2;
  const showEmail = showPhone && isValidVendorPhone(values.contactNumber);
  const showVerify = showEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) && !emailVerified;
  const showCR = showEmail;

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
        <VendorField label={t.labels.establishmentName} helper={t.helpers.establishmentName}>
          <Input {...form.register("establishmentName")} autoComplete="organization" className="h-12 text-base" autoFocus />
          <VendorErrorText text={form.formState.errors.establishmentName?.message} isRtl={isRtl} />
        </VendorField>

        <AnimatePresence>
          {showManager && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <VendorField label={t.labels.managerName}>
                <Input {...form.register("managerName")} className="h-12 text-base" />
                <VendorErrorText text={form.formState.errors.managerName?.message} isRtl={isRtl} />
              </VendorField>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPhone && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <VendorField label={t.labels.contactNumber} helper={t.helpers.contactNumber}>
                <Input
                  {...form.register("contactNumber")}
                  className="h-12 text-base"
                  dir="ltr"
                  placeholder={textByLang(isRtl, "+9665xxxxxxxx or +971...", "+9665xxxxxxxx أو +971...")}
                  inputMode="tel"
                  autoComplete="tel"
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
          {showCR && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <VendorField label={t.labels.crNumber}>
                <Input {...form.register("crNumber")} inputMode="numeric" className="h-12 text-base" dir="ltr" />
                <VendorErrorText text={form.formState.errors.crNumber?.message} isRtl={isRtl} />
              </VendorField>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 border-t border-brand-dark/10 pt-6">
        <Button type="submit" size="lg" disabled={isLoading || !showCR} className="w-full rounded-full bg-brand-primary hover:bg-brand-dark sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
        </Button>
        {submitError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
      </div>
    </form>
  );
}