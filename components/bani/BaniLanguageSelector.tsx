import type { BaniLanguage } from "@/lib/bani/types";

const languages: { value: BaniLanguage; label: string; dir: "rtl" | "ltr" }[] = [
  { value: "ar", label: "العربية", dir: "rtl" },
  { value: "en", label: "English", dir: "ltr" },
  { value: "zh", label: "中文", dir: "ltr" },
  { value: "ur", label: "اردو", dir: "rtl" }
];

type BaniLanguageSelectorProps = {
  onSelect: (language: BaniLanguage) => void;
};

export function BaniLanguageSelector({ onSelect }: BaniLanguageSelectorProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-1 py-8 text-center sm:px-6">
      <span className="text-sm font-bold tracking-[0.16em] text-brand-primary">✦ BANI</span>
      <h3 className="mt-5 text-xl font-bold leading-9 text-brand-dark sm:text-2xl">
        حياك الله، أنا باني ✦
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-brand-dark/70 sm:text-base">
        لاهنت أرسل لي أي شيء يتعلق بشركتك، وأنا أرتب لك بيانات التسجيل.
      </p>
      <p className="mt-8 text-sm font-semibold text-brand-dark">اختر لغتك</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="اختر لغة BANI">
        {languages.map((language) => (
          <button
            key={language.value}
            type="button"
            dir={language.dir}
            onClick={() => onSelect(language.value)}
            className="min-h-12 rounded-xl border border-brand-dark/15 bg-white px-4 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
          >
            {language.label}
          </button>
        ))}
      </div>
    </div>
  );
}
