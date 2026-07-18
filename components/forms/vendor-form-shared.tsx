"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import {
  composeVendorPhone,
  localizeVendorError,
  parseVendorPhone,
  textByLang,
  vendorDialCodes,
  type VendorOption,
} from "@/lib/vendor-options";

export function VendorField({
  label,
  helper,
  children,
  className,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {helper && <p className="text-sm leading-6 text-brand-dark/58">{helper}</p>}
      {children}
    </div>
  );
}

export function VendorErrorText({ text, isRtl }: { text?: string; isRtl: boolean }) {
  if (!text) return null;
  return <p className="type-small text-red-600">{localizeVendorError(text, isRtl)}</p>;
}

export function VendorOptionGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-2", className)}>{children}</div>;
}

export function VendorOptionCard({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 type-small font-semibold transition",
        checked
          ? "border-brand-primary bg-brand-primary/10 text-brand-dark"
          : "border-brand-dark/15 bg-white text-brand-dark/78 hover:border-brand-dark/30"
      )}
    >
      {children}
    </label>
  );
}

export function VendorStepTabs({ labels, currentStep }: { labels: string[]; currentStep: number }) {
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

export function VendorBinaryField({
  label,
  value,
  onChange,
  options,
  isRtl,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: VendorOption[];
  isRtl: boolean;
}) {
  return (
    <VendorField label={label}>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
              value === option.value ? "border-brand-primary bg-brand-primary/10" : "border-brand-dark/15 hover:border-brand-dark/30"
            )}
            onClick={() => onChange(option.value)}
          >
            <RadioGroupItem value={option.value} checked={value === option.value} />
            <span className="type-small text-brand-dark/90">{isRtl ? option.ar : option.en}</span>
          </label>
        ))}
      </div>
    </VendorField>
  );
}

export function VendorPhoneInput({
  value,
  onChange,
  isRtl = false,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  isRtl?: boolean;
  hasError?: boolean;
}) {
  const parsed = parseVendorPhone(value);
  const dialCode = parsed.dialCode;
  const localNumber = parsed.localNumber;

  const setDial = (code: string) => onChange(composeVendorPhone(code, localNumber));
  const setLocal = (digits: string) => onChange(composeVendorPhone(dialCode, digits));

  const placeholder =
    dialCode === "+966"
      ? textByLang(isRtl, "5X XXX XXXX", "5X XXX XXXX")
      : textByLang(isRtl, "Mobile number", "رقم الجوال");

  return (
    <div
      className={cn(
        "flex h-12 overflow-hidden rounded-xl border bg-white transition focus-within:ring-2 focus-within:ring-brand-primary/20",
        hasError ? "border-red-300 focus-within:border-red-400" : "border-brand-dark/15 focus-within:border-brand-primary"
      )}
      dir="ltr"
    >
      <select
        value={dialCode}
        onChange={(e) => setDial(e.target.value)}
        className="h-full min-w-[7.5rem] max-w-[9.5rem] shrink-0 border-0 border-r border-brand-dark/10 bg-brand-light/40 px-2.5 text-sm font-semibold text-brand-dark outline-none"
        aria-label={textByLang(isRtl, "Country code", "رمز الدولة")}
      >
        {vendorDialCodes.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {isRtl ? c.labelAr : c.labelEn}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={localNumber}
        onChange={(e) => setLocal(e.target.value.replace(/\D/g, "").slice(0, 15))}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-base text-brand-dark outline-none placeholder:text-brand-dark/35"
      />
    </div>
  );
}

export function VendorReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <dt className="type-small font-semibold text-brand-dark/70">{label}</dt>
      <dd className="type-small mt-1 text-brand-dark">{value}</dd>
    </div>
  );
}

/** إدخال متعدد على شكل شرائح (Tags) — بديل عن كتابة قائمة مفصولة بفواصل يدوياً */
export function VendorTagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-dark/15 bg-white px-3 py-2 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-sm text-brand-dark">
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="text-brand-dark/45 hover:text-red-600"
            aria-label="remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={values.length ? "" : placeholder}
        className="h-8 min-w-[140px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-brand-dark/35"
      />
    </div>
  );
}