"use client";

import { useState } from "react";

import { BaniChat } from "@/components/bani/BaniChat";
import { BaniLanguageSelector } from "@/components/bani/BaniLanguageSelector";
import type { BaniLanguage } from "@/lib/bani/types";

export function BaniPanel() {
  const [language, setLanguage] = useState<BaniLanguage | null>(null);

  return (
    <div className="flex h-[min(70svh,620px)] min-h-[430px] flex-col border-t border-brand-dark/10 bg-white/80">
      {language ? (
        <BaniChat key={language} language={language} onChangeLanguage={() => setLanguage(null)} />
      ) : (
        <BaniLanguageSelector onSelect={setLanguage} />
      )}
    </div>
  );
}
