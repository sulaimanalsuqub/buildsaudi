"use client";

import { GlobalErrorContent } from "@/components/errors/global-error-content";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalErrorContent error={error} reset={reset} />;
}
