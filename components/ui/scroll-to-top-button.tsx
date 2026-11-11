"use client";

import { ArrowUp } from "lucide-react";

export function ScrollToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="scroll to top"
      className="fixed bottom-6 end-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-ink)] shadow-lg transition-transform hover:-translate-y-0.5"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
