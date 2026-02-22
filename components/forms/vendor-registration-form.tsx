"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";

type FormData = {
  companyName: string;
  crNumber: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  yearsInBusiness: string;
  region: string;
};

const initialState: FormData = {
  companyName: "",
  crNumber: "",
  contactName: "",
  email: "",
  phone: "",
  category: "",
  yearsInBusiness: "",
  region: ""
};

const stepLabels = ["Company", "Contact", "Capabilities", "Review"];

export function VendorRegistrationForm() {
  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [data, setData] = useState<FormData>(initialState);
  const [error, setError] = useState("");

  const progress = useMemo(() => ((step + 1) / stepLabels.length) * 100, [step]);

  const updateField = (name: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    if (step === 0 && (!data.companyName || !data.crNumber)) return "Please complete company details.";
    if (step === 1 && (!data.contactName || !data.email || !data.phone)) return "Please complete contact information.";
    if (step === 2 && (!data.category || !data.region || !data.yearsInBusiness)) return "Please complete capability details.";
    return "";
  };

  const nextStep = () => {
    const validationMessage = validateStep();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError("");
    setStep((prev) => Math.min(prev + 1, stepLabels.length - 1));
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

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-3xl rounded-xl border border-brand-dark/10 bg-white p-8 text-center">
        <h2 className="type-section-title text-brand-dark">Registration Submitted</h2>
        <p className="type-body mt-4 text-brand-dark/75">
          Thank you. Your vendor profile is now under review. Our procurement team will contact you shortly.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl rounded-xl border border-brand-dark/10 bg-white p-6 md:p-8" aria-label="Vendor registration form">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-brand-dark/70">Step {step + 1} of {stepLabels.length}</p>
          <p className="text-sm font-semibold text-brand-dark">{stepLabels[step]}</p>
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

      <div className="grid gap-4">
        {step === 0 && (
          <>
            <Input label="Company Legal Name" id="companyName" value={data.companyName} onChange={(value) => updateField("companyName", value)} required />
            <Input label="Commercial Registration Number" id="crNumber" value={data.crNumber} onChange={(value) => updateField("crNumber", value)} required />
          </>
        )}

        {step === 1 && (
          <>
            <Input label="Contact Person" id="contactName" value={data.contactName} onChange={(value) => updateField("contactName", value)} required />
            <Input label="Business Email" id="email" value={data.email} onChange={(value) => updateField("email", value)} type="email" required />
            <Input label="Mobile Number" id="phone" value={data.phone} onChange={(value) => updateField("phone", value)} required />
          </>
        )}

        {step === 2 && (
          <>
            <Select
              label="Vendor Category"
              id="category"
              value={data.category}
              onChange={(value) => updateField("category", value)}
              options={["Civil Materials", "MEP Works", "Finishing", "Equipment Rental"]}
              required
            />
            <Select
              label="Primary Region"
              id="region"
              value={data.region}
              onChange={(value) => updateField("region", value)}
              options={["Riyadh", "Jeddah", "Dammam", "Makkah"]}
              required
            />
            <Select
              label="Years in Business"
              id="yearsInBusiness"
              value={data.yearsInBusiness}
              onChange={(value) => updateField("yearsInBusiness", value)}
              options={["1-3 years", "4-7 years", "8-12 years", "12+ years"]}
              required
            />
          </>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-brand-dark/10 bg-brand-light p-4">
            <h3 className="text-lg font-semibold text-brand-dark">Review Details</h3>
            <dl className="mt-3 space-y-2 text-sm text-brand-dark/85">
              <div><dt className="font-semibold">Company:</dt><dd>{data.companyName}</dd></div>
              <div><dt className="font-semibold">CR Number:</dt><dd>{data.crNumber}</dd></div>
              <div><dt className="font-semibold">Contact:</dt><dd>{data.contactName}</dd></div>
              <div><dt className="font-semibold">Email:</dt><dd>{data.email}</dd></div>
              <div><dt className="font-semibold">Phone:</dt><dd>{data.phone}</dd></div>
              <div><dt className="font-semibold">Category:</dt><dd>{data.category}</dd></div>
              <div><dt className="font-semibold">Region:</dt><dd>{data.region}</dd></div>
              <div><dt className="font-semibold">Experience:</dt><dd>{data.yearsInBusiness}</dd></div>
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
          Back
        </button>

        {step < stepLabels.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark/90"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark/90"
          >
            Submit Registration
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
};

function Input({ label, id, value, onChange, required = false, type = "text" }: InputProps) {
  return (
    <label htmlFor={id} className="space-y-2">
      <span className="text-sm font-semibold text-brand-dark">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-brand-dark/20 bg-white px-4 py-2.5 text-base text-brand-dark outline-none transition focus:border-brand-dark/40 focus:ring-2 focus:ring-brand-dark/10"
      />
    </label>
  );
}

type SelectProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
};

function Select({ label, id, value, onChange, options, required = false }: SelectProps) {
  return (
    <label htmlFor={id} className="space-y-2">
      <span className="text-sm font-semibold text-brand-dark">{label}</span>
      <select
        id={id}
        name={id}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-brand-dark/20 bg-white px-4 py-2.5 text-base text-brand-dark outline-none transition focus:border-brand-dark/40 focus:ring-2 focus:ring-brand-dark/10"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
