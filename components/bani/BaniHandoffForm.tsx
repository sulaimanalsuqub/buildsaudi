"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  businessTypes,
  isValidVendorPhone,
  normalizeVendorPhone,
  optionLabel,
  supplierCountries,
} from "@/lib/vendor-options";
import { VendorErrorText, VendorField, VendorOptionCard, VendorOptionGrid, VendorPhoneInput } from "@/components/forms/vendor-form-shared";
import type { BaniExtraction } from "@/lib/bani/extraction";
import type { BaniLanguage } from "@/lib/bani/types";

type MaterialCategory = { id: string; nameAr: string; nameEn: string };

type BaniHandoffFormProps = {
  extraction: BaniExtraction;
  language: BaniLanguage;
};

// The confirm-and-submit step BANI hands off to once it has enough narrative info (company name,
// country, business type, description) — the fields an LLM shouldn't be trusted to fill silently
// (contact details, category selection, legal consent, bot-check) are collected here as real
// inputs/checkboxes instead, then submitted through the exact same /api/vendors/register contract
// vendor-registration-form.tsx uses, so this doesn't need its own backend path.
export function BaniHandoffForm({ extraction, language }: BaniHandoffFormProps) {
  const isRtl = language === "ar" || language === "ur";
  const t = {
    heading: isRtl ? "راجع بياناتك وأكمل التسجيل" : "Review your details and finish registering",
    establishmentName: isRtl ? "اسم المنشأة" : "Establishment name",
    country: isRtl ? "بلد المنشأة" : "Establishment country",
    businessType: isRtl ? "نوع النشاط التجاري" : "Business type",
    categories: isRtl ? "فئات المنتجات" : "Product categories",
    categoriesLoading: isRtl ? "جاري تحميل الفئات…" : "Loading categories…",
    categoriesError: isRtl ? "تعذر تحميل الفئات. أعد تحميل الصفحة." : "Could not load categories. Please refresh the page.",
    shortDescription: isRtl ? "وصف مختصر لمنتجاتكم (اختياري)" : "Brief description (optional)",
    contactName: isRtl ? "المسؤول" : "Responsible person",
    contactNumber: isRtl ? "رقم الجوال" : "Mobile number",
    email: isRtl ? "البريد الإلكتروني" : "Email",
    privacyLabel: isRtl ? "أوافق على سياسة الخصوصية" : "I agree to the Privacy Policy",
    termsLabel: isRtl ? "أوافق على شروط التسجيل" : "I agree to the Registration Terms",
    submit: isRtl ? "إرسال طلب الانضمام" : "Submit Application",
    submittedTitle: isRtl ? "تم استلام طلب الانضمام" : "Application Received",
    submittedBody: isRtl
      ? "استلمنا طلبكم. سيراجعه فريقنا ويتواصل معكم إذا احتجنا أي معلومات إضافية."
      : "We received your application. Our team will review it and reach out if we need anything else.",
  };

  const [establishmentName, setEstablishmentName] = useState(extraction.establishmentName ?? "");
  const [country, setCountry] = useState("sa");
  const [businessType, setBusinessType] = useState(extraction.businessType ?? "");
  const [shortDescription, setShortDescription] = useState(extraction.shortDescription ?? "");
  const [categories, setCategories] = useState<MaterialCategory[] | null>(null);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).onBaniTurnstileVerified = (token: string) => setTurnstileToken(token);
    return () => {
      delete (window as unknown as Record<string, unknown>).onBaniTurnstileVerified;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reference/material-categories")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body?.ok && Array.isArray(body.categories)) setCategories(body.categories);
        else setCategoriesFailed(true);
      })
      .catch(() => {
        if (!cancelled) setCategoriesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCategory = (id: string) => {
    setCategoryIds((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
  };

  const phoneValid = isValidVendorPhone(contactNumber);
  const canSubmit =
    establishmentName.trim().length >= 2 &&
    !!businessType &&
    categoryIds.length > 0 &&
    contactName.trim().length >= 2 &&
    phoneValid &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    privacyAccepted &&
    termsAccepted &&
    (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !!turnstileToken);

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setIsLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_name: establishmentName.trim(),
          country: optionLabel(true, supplierCountries, country),
          supplier_type: country === "sa" ? "local" : "international",
          business_type: businessType,
          contact_name: contactName.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizeVendorPhone(contactNumber),
          category_names: categoryIds,
          brands: extraction.brands ?? [],
          short_description: shortDescription.trim() || undefined,
          preferred_language: language === "ar" ? "ar" : "en",
          privacy_accepted: privacyAccepted,
          terms_accepted: termsAccepted,
          turnstile_token: turnstileToken || "bani-no-turnstile-configured",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(body?.error || (isRtl ? "تعذر إرسال الطلب" : "Could not submit the application"));
        setIsLoading(false);
        return;
      }
      setIsSubmitted(true);
    } catch {
      setSubmitError(isRtl ? "تعذر الاتصال بالخادم" : "Could not reach the server");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center" dir={isRtl ? "rtl" : "ltr"}>
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="text-lg font-bold text-brand-dark">{t.submittedTitle}</p>
        <p className="max-w-sm text-sm text-brand-dark/65">{t.submittedBody}</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5" dir={isRtl ? "rtl" : "ltr"}>
      <p className="mb-4 text-sm font-bold text-brand-dark">{t.heading}</p>
      <div className="space-y-4">
        <VendorField label={t.establishmentName}>
          <Input value={establishmentName} onChange={(e) => setEstablishmentName(e.target.value)} className="h-11 text-base" />
        </VendorField>

        <VendorField label={t.country}>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-11 w-full rounded-xl border border-brand-dark/15 bg-white px-3 text-base outline-none focus:border-brand-primary"
          >
            {supplierCountries.map((c) => (
              <option key={c.value} value={c.value}>
                {isRtl ? c.ar : c.en}
              </option>
            ))}
          </select>
        </VendorField>

        <VendorField label={t.businessType}>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="h-11 w-full rounded-xl border border-brand-dark/15 bg-white px-3 text-base outline-none focus:border-brand-primary"
          >
            <option value="" disabled>
              {isRtl ? "اختر نوع النشاط" : "Select business type"}
            </option>
            {businessTypes.map((b) => (
              <option key={b.value} value={b.value}>
                {isRtl ? b.ar : b.en}
              </option>
            ))}
          </select>
        </VendorField>

        <VendorField label={t.categories}>
          {categoriesFailed ? (
            <p className="text-sm text-red-600">{t.categoriesError}</p>
          ) : !categories ? (
            <p className="text-sm text-brand-dark/50">{t.categoriesLoading}</p>
          ) : (
            <VendorOptionGrid>
              {categories.map((cat) => (
                <VendorOptionCard key={cat.id} checked={categoryIds.includes(cat.id)}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-primary"
                    checked={categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  {isRtl ? cat.nameAr : cat.nameEn}
                </VendorOptionCard>
              ))}
            </VendorOptionGrid>
          )}
          {touched && categoryIds.length === 0 && <VendorErrorText text="required" isRtl={isRtl} />}
        </VendorField>

        <VendorField label={t.shortDescription}>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="min-h-[72px] w-full rounded-xl border border-brand-dark/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-primary"
          />
        </VendorField>

        <VendorField label={t.contactName}>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-11 text-base" />
          {touched && contactName.trim().length < 2 && <VendorErrorText text="required" isRtl={isRtl} />}
        </VendorField>

        <VendorField label={t.contactNumber}>
          <VendorPhoneInput value={contactNumber} onChange={setContactNumber} isRtl={isRtl} hasError={touched && !phoneValid} />
          {touched && !phoneValid && <VendorErrorText text="invalidPhone" isRtl={isRtl} />}
        </VendorField>

        <VendorField label={t.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="h-11 text-base" />
        </VendorField>

        <div className="space-y-3 rounded-xl bg-brand-light/40 p-4">
          <label className="flex items-start gap-3 text-sm text-brand-dark/85">
            <Checkbox checked={privacyAccepted} onCheckedChange={(v) => setPrivacyAccepted(v === true)} />
            {t.privacyLabel}
          </label>
          <label className="flex items-start gap-3 text-sm text-brand-dark/85">
            <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} />
            {t.termsLabel}
          </label>
        </div>

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-callback="onBaniTurnstileVerified"
              data-language={isRtl ? "ar" : "en"}
            />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full rounded-full bg-brand-primary hover:bg-brand-dark">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
        </Button>
        {submitError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
      </div>
    </div>
  );
}
