"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";

type YesNo = "yes" | "no" | "";

type FormData = {
  establishmentName: string;
  managerName: string;
  contactNumber: string;
  email: string;
  crNumber: string;
  productCategories: string[];
  vendorType: string;
  representedBrands: string;
  coverageRegions: string[];
  hasWarehouseInKsa: YesNo;
  offersCredit: YesNo;
  paymentTerms: string[];
  creditLimit: string;
  workedOnGovProjects: YesNo;
};

type VendorRegistrationFormProps = {
  isRtl?: boolean;
};

const initialState: FormData = {
  establishmentName: "",
  managerName: "",
  contactNumber: "",
  email: "",
  crNumber: "",
  productCategories: [],
  vendorType: "",
  representedBrands: "",
  coverageRegions: [],
  hasWarehouseInKsa: "",
  offersCredit: "",
  paymentTerms: [],
  creditLimit: "",
  workedOnGovProjects: ""
};

export function VendorRegistrationForm({ isRtl = false }: VendorRegistrationFormProps) {
  const t = {
    stepLabels: isRtl ? ["البيانات الأساسية", "فئات ونوع المورد", "التغطية والمالية", "المراجعة"] : ["Basic Info", "Categories & Type", "Coverage & Financial", "Review"],
    stepText: isRtl ? "الخطوة" : "Step",
    ofText: isRtl ? "من" : "of",
    submittedTitle: isRtl ? "تم إرسال طلب التوريد" : "Supply Request Submitted",
    submittedBody: isRtl
      ? "شكرًا لك. طلبكم قيد المراجعة الآن وسيتواصل معكم فريق بيلد بخصوص فرص التوريد المناسبة."
      : "Thank you. Your request is under review. The Build team will contact you about matching supply opportunities.",
    labels: {
      establishmentName: isRtl ? "اسم المنشأة" : "Establishment Name",
      managerName: isRtl ? "المسؤول" : "Responsible Person",
      contactNumber: isRtl ? "رقم التواصل" : "Contact Number",
      email: isRtl ? "البريد الإلكتروني" : "Email",
      crNumber: isRtl ? "رقم السجل" : "Commercial Registration Number",
      productCategories: isRtl ? "فئة المنتجات" : "Product Categories",
      vendorType: isRtl ? "هل أنتم" : "You Are",
      representedBrands: isRtl ? "العلامات التجارية التي تمثلونها" : "Brands You Represent",
      coverageRegions: isRtl ? "مناطق التغطية" : "Coverage Regions",
      hasWarehouseInKsa: isRtl ? "هل لديكم مستودع داخل المملكة؟" : "Do you have a warehouse in KSA?",
      offersCredit: isRtl ? "هل لديكم قدرة على منح آجل؟" : "Can you provide credit terms?",
      paymentTerms: isRtl ? "شروط الدفع" : "Payment Terms",
      creditLimit: isRtl ? "الحد الائتماني التقريبي" : "Estimated Credit Limit",
      workedOnGovProjects: isRtl ? "هل سبق لكم العمل في مشاريع حكومية؟" : "Have you worked on government projects before?"
    },
    validation: {
      basic: isRtl ? "يرجى استكمال البيانات الأساسية بشكل صحيح." : "Please complete the basic information correctly.",
      categories: isRtl ? "يرجى اختيار فئة منتجات واحدة على الأقل ونوع المورد." : "Please select at least one product category and vendor type.",
      brands: isRtl ? "يرجى إدخال العلامات التجارية التي تمثلونها." : "Please enter the brands you represent.",
      coverage: isRtl ? "يرجى استكمال بيانات التغطية والشروط المالية." : "Please complete coverage and financial details."
    },
    searchRegions: isRtl ? "ابحث عن منطقة..." : "Search regions...",
    yes: isRtl ? "نعم" : "Yes",
    no: isRtl ? "لا" : "No",
    back: isRtl ? "السابق" : "Back",
    continue: isRtl ? "متابعة" : "Continue",
    submit: isRtl ? "إرسال الطلب" : "Submit Registration",
    reviewTitle: isRtl ? "مراجعة البيانات" : "Review Details",
    none: isRtl ? "غير محدد" : "Not provided",
    vendorTypeOptions: isRtl
      ? ["مصنع مباشر", "موزع معتمد", "وكيل حصري", "مورد مشاريع", "مستورد"]
      : ["Direct Manufacturer", "Authorized Distributor", "Exclusive Agent", "Project Supplier", "Importer"],
    productCategoryOptions: isRtl
      ? [
          "مواد بناء وإنشاء",
          "أدوات السلامة",
          "دهانات وديكور",
          "كهرباء وإنارة",
          "سباكة",
          "أدوات صحية",
          "تكييف وتبريد",
          "أنظمة الأنابيب",
          "مضخات وخزانات",
          "أرضيات وسيراميك",
          "عوازل",
          "مواد لاصقة"
        ]
      : [
          "Building Materials",
          "Safety Tools",
          "Paint & Decor",
          "Electrical & Lighting",
          "Plumbing",
          "Sanitary Ware",
          "HVAC",
          "Piping Systems",
          "Pumps & Tanks",
          "Flooring & Ceramics",
          "Insulation",
          "Adhesives"
        ],
    regionOptions: isRtl
      ? [
          "الرياض",
          "مكة",
          "المدينة",
          "الشرقية",
          "القصيم",
          "عسير",
          "تبوك",
          "حائل",
          "الحدود الشمالية",
          "جازان",
          "نجران",
          "الباحة",
          "الجوف",
          "كل المملكة"
        ]
      : [
          "Riyadh",
          "Makkah",
          "Madinah",
          "Eastern Province",
          "Qassim",
          "Asir",
          "Tabuk",
          "Hail",
          "Northern Borders",
          "Jazan",
          "Najran",
          "Al Baha",
          "Al Jouf",
          "All Saudi Arabia"
        ],
    paymentTermOptions: isRtl ? ["تحويل بنكي", "شيك", "30 يوم", "60 يوم"] : ["Bank Transfer", "Cheque", "30 Days", "60 Days"]
  };

  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [data, setData] = useState<FormData>(initialState);
  const [error, setError] = useState("");
  const [regionSearch, setRegionSearch] = useState("");

  const progress = useMemo(() => ((step + 1) / t.stepLabels.length) * 100, [step, t.stepLabels.length]);

  const filteredRegions = useMemo(() => {
    const normalized = regionSearch.trim().toLowerCase();
    if (!normalized) return t.regionOptions;
    return t.regionOptions.filter((region) => region.toLowerCase().includes(normalized));
  }, [regionSearch, t.regionOptions]);

  const updateField = <K extends keyof FormData>(name: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayValue = (field: "productCategories" | "coverageRegions" | "paymentTerms", value: string) => {
    setData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists ? prev[field].filter((item) => item !== value) : [...prev[field], value]
      };
    });
  };

  const validateStep = () => {
    if (step === 0) {
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      if (!data.establishmentName || !data.managerName || !data.contactNumber || !data.email || !data.crNumber || !isEmailValid) {
        return t.validation.basic;
      }
    }

    if (step === 1) {
      if (data.productCategories.length === 0 || !data.vendorType) return t.validation.categories;
      const importerValue = isRtl ? "مستورد" : "Importer";
      if (data.vendorType === importerValue && !data.representedBrands.trim()) return t.validation.brands;
    }

    if (step === 2) {
      if (
        data.coverageRegions.length === 0 ||
        !data.hasWarehouseInKsa ||
        !data.offersCredit ||
        data.paymentTerms.length === 0 ||
        !data.creditLimit ||
        !data.workedOnGovProjects
      ) {
        return t.validation.coverage;
      }
    }

    return "";
  };

  const nextStep = () => {
    const validationMessage = validateStep();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError("");
    setStep((prev) => Math.min(prev + 1, t.stepLabels.length - 1));
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validateStep();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError("");
    setIsSubmitted(true);
  };

  const importerValue = isRtl ? "مستورد" : "Importer";

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-4xl rounded-xl border border-brand-dark/10 bg-white p-8 text-center">
        <h2 className="type-section-title text-brand-dark">{t.submittedTitle}</h2>
        <p className="type-body mt-4 text-brand-dark/75">{t.submittedBody}</p>
      </section>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-4xl rounded-xl border border-brand-dark/10 bg-white p-6 md:p-8"
      aria-label={isRtl ? "نموذج طلب التوريد" : "Supply request form"}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-brand-dark/70">
            {t.stepText} {step + 1} {t.ofText} {t.stepLabels.length}
          </p>
          <p className="text-sm font-semibold text-brand-dark">{t.stepLabels[step]}</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-brand-light" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="h-full rounded-full bg-brand-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      <div className="grid gap-5">
        {step === 0 && (
          <>
            <Input label={t.labels.establishmentName} id="establishmentName" value={data.establishmentName} onChange={(value) => updateField("establishmentName", value)} required />
            <Input label={t.labels.managerName} id="managerName" value={data.managerName} onChange={(value) => updateField("managerName", value)} required />
            <Input label={t.labels.contactNumber} id="contactNumber" value={data.contactNumber} onChange={(value) => updateField("contactNumber", value)} required />
            <Input label={t.labels.email} id="email" value={data.email} onChange={(value) => updateField("email", value)} type="email" required />
            <Input label={t.labels.crNumber} id="crNumber" value={data.crNumber} onChange={(value) => updateField("crNumber", value)} required />
          </>
        )}

        {step === 1 && (
          <>
            <CheckboxMultiSelect
              label={t.labels.productCategories}
              options={t.productCategoryOptions}
              selected={data.productCategories}
              onToggle={(value) => toggleArrayValue("productCategories", value)}
            />

            <RadioGroup
              label={t.labels.vendorType}
              name="vendorType"
              options={t.vendorTypeOptions}
              selectedValue={data.vendorType}
              onChange={(value) => updateField("vendorType", value)}
            />

            {data.vendorType === importerValue && (
              <Input
                label={t.labels.representedBrands}
                id="representedBrands"
                value={data.representedBrands}
                onChange={(value) => updateField("representedBrands", value)}
                placeholder={isRtl ? "مثال: ABC, XYZ" : "Example: ABC, XYZ"}
                required
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <CheckboxMultiSelect
              label={t.labels.coverageRegions}
              options={filteredRegions}
              selected={data.coverageRegions}
              onToggle={(value) => toggleArrayValue("coverageRegions", value)}
              searchValue={regionSearch}
              onSearchChange={setRegionSearch}
              searchPlaceholder={t.searchRegions}
              emptyMessage={isRtl ? "لا توجد نتائج مطابقة" : "No matching regions"}
            />

            <RadioGroup
              label={t.labels.hasWarehouseInKsa}
              name="hasWarehouseInKsa"
              options={[t.yes, t.no]}
              selectedValue={data.hasWarehouseInKsa === "yes" ? t.yes : data.hasWarehouseInKsa === "no" ? t.no : ""}
              onChange={(value) => updateField("hasWarehouseInKsa", value === t.yes ? "yes" : "no")}
            />

            <RadioGroup
              label={t.labels.offersCredit}
              name="offersCredit"
              options={[t.yes, t.no]}
              selectedValue={data.offersCredit === "yes" ? t.yes : data.offersCredit === "no" ? t.no : ""}
              onChange={(value) => updateField("offersCredit", value === t.yes ? "yes" : "no")}
            />

            <CheckboxMultiSelect
              label={t.labels.paymentTerms}
              options={t.paymentTermOptions}
              selected={data.paymentTerms}
              onToggle={(value) => toggleArrayValue("paymentTerms", value)}
            />

            <Input
              label={t.labels.creditLimit}
              id="creditLimit"
              value={data.creditLimit}
              onChange={(value) => updateField("creditLimit", value)}
              placeholder={isRtl ? "مثال: 250,000 ريال" : "Example: 250,000 SAR"}
              required
            />

            <RadioGroup
              label={t.labels.workedOnGovProjects}
              name="workedOnGovProjects"
              options={[t.yes, t.no]}
              selectedValue={data.workedOnGovProjects === "yes" ? t.yes : data.workedOnGovProjects === "no" ? t.no : ""}
              onChange={(value) => updateField("workedOnGovProjects", value === t.yes ? "yes" : "no")}
            />
          </>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-brand-dark/10 bg-brand-light p-4">
            <h3 className="text-lg font-semibold text-brand-dark">{t.reviewTitle}</h3>
            <dl className="mt-3 space-y-2 text-sm text-brand-dark/85">
              <Row label={t.labels.establishmentName} value={data.establishmentName} />
              <Row label={t.labels.managerName} value={data.managerName} />
              <Row label={t.labels.contactNumber} value={data.contactNumber} />
              <Row label={t.labels.email} value={data.email} />
              <Row label={t.labels.crNumber} value={data.crNumber} />
              <Row label={t.labels.productCategories} value={data.productCategories.join("، ") || t.none} />
              <Row label={t.labels.vendorType} value={data.vendorType || t.none} />
              {data.vendorType === importerValue && <Row label={t.labels.representedBrands} value={data.representedBrands || t.none} />}
              <Row label={t.labels.coverageRegions} value={data.coverageRegions.join("، ") || t.none} />
              <Row label={t.labels.hasWarehouseInKsa} value={data.hasWarehouseInKsa ? (data.hasWarehouseInKsa === "yes" ? t.yes : t.no) : t.none} />
              <Row label={t.labels.offersCredit} value={data.offersCredit ? (data.offersCredit === "yes" ? t.yes : t.no) : t.none} />
              <Row label={t.labels.paymentTerms} value={data.paymentTerms.join("، ") || t.none} />
              <Row label={t.labels.creditLimit} value={data.creditLimit || t.none} />
              <Row label={t.labels.workedOnGovProjects} value={data.workedOnGovProjects ? (data.workedOnGovProjects === "yes" ? t.yes : t.no) : t.none} />
            </dl>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 0}
          className="rounded-lg border border-brand-dark/20 px-5 py-2.5 text-sm font-semibold text-brand-dark transition enabled:hover:border-brand-dark/40 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t.back}
        </button>

        {step < t.stepLabels.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark/90"
          >
            {t.continue}
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark/90"
          >
            {isRtl ? "إرسال طلب التوريد" : "Submit Supply Request"}
          </button>
        )}
      </div>
    </form>
  );
}

type InputProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email";
  placeholder?: string;
};

function Input({ label, id, value, onChange, required = false, type = "text", placeholder }: InputProps) {
  return (
    <label htmlFor={id} className="space-y-2">
      <span className="text-sm font-semibold text-brand-dark">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-brand-dark/20 bg-white px-4 py-2.5 text-base text-brand-dark outline-none transition focus:border-brand-dark/40 focus:ring-2 focus:ring-brand-dark/10"
      />
    </label>
  );
}

type CheckboxMultiSelectProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

function CheckboxMultiSelect({
  label,
  options,
  selected,
  onToggle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  emptyMessage
}: CheckboxMultiSelectProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-brand-dark">{label}</legend>
      {typeof searchValue === "string" && onSearchChange && (
        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="mb-2 w-full rounded-lg border border-brand-dark/20 bg-white px-4 py-2.5 text-sm text-brand-dark outline-none transition focus:border-brand-dark/40 focus:ring-2 focus:ring-brand-dark/10"
        />
      )}
      {options.length === 0 && <p className="text-sm text-brand-dark/60">{emptyMessage}</p>}
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const isChecked = selected.includes(option);
          return (
            <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-dark/15 px-3 py-2 text-sm text-brand-dark/90 hover:border-brand-dark/35">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded border-brand-dark/30 text-brand-primary focus:ring-brand-primary/40"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type RadioGroupProps = {
  label: string;
  name: string;
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
};

function RadioGroup({ label, name, options, selectedValue, onChange }: RadioGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-brand-dark">{label}</legend>
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-dark/15 px-3 py-2 text-sm text-brand-dark/90 hover:border-brand-dark/35">
            <input
              type="radio"
              name={name}
              checked={selectedValue === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 border-brand-dark/30 text-brand-primary focus:ring-brand-primary/40"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}
