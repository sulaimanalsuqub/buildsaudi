"use client";
import { interfaceCopy, interfacePair } from "@/lib/dictionaries/interface";


import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, PackageSearch, Search } from "lucide-react";

import { Container } from "@/components/ui/container";

type TrackingData = {
  trackingNumber: string;
  projectName: string;
  customerStatus: string;
  requestDate: string;
  declineReason: string | null;
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  received: interfacePair("track_request_content_101"),
  reviewing: interfacePair("track_request_content_102"),
  need_info: interfacePair("track_request_content_103"),
  pricing: interfacePair("track_request_content_104"),
  quote_preparing: interfacePair("track_request_content_105"),
  quote_ready: interfacePair("track_request_content_106"),
  confirmed: interfacePair("track_request_content_107"),
  preparing: interfacePair("track_request_content_108"),
  ready_to_ship: interfacePair("track_request_content_109"),
  in_transit: interfacePair("track_request_content_110"),
  arrived: interfacePair("track_request_content_111"),
  delivered: interfacePair("track_request_content_112"),
  needs_attention: interfacePair("track_request_content_113"),
  completed: interfacePair("track_request_content_114"),
  declined: interfacePair("track_request_content_115"),
};

const DECLINE_REASON_LABELS: Record<string, { ar: string; en: string }> = {
  items_unavailable: interfacePair("track_request_content_116"),
  high_demand: interfacePair("track_request_content_117"),
  outside_coverage: interfacePair("track_request_content_118"),
  unclear_scope: interfacePair("track_request_content_119"),
  other: interfacePair("track_request_content_120"),
};

export function TrackRequestContent({ isRtl = false }: { isRtl?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(Boolean(token));
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!token) {
      // لا رمز في الرابط — نعرض خانة الإدخال بدل رسالة خطأ
      setLoading(false);
      setData(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await fetch(`/api/quotes/track?token=${encodeURIComponent(token)}`);
        const body = (await res.json().catch(() => null)) as (TrackingData & { ok: true }) | { error?: string } | null;
        if (cancelled) return;
        if (!res.ok || !body || !("ok" in body)) {
          setError(body && "error" in body && body.error ? body.error : interfaceCopy(isRtl, "track_request_content_001"));
          return;
        }
        setData(body);
      } catch {
        if (!cancelled) setError(interfaceCopy(isRtl, "track_request_content_002"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isRtl]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    const base = isRtl ? "/ar/track-request" : "/track-request";
    router.push(`${base}?token=${encodeURIComponent(value)}`);
  };

  const statusLabel = data ? STATUS_LABELS[data.customerStatus] : null;
  const isDeclined = data?.customerStatus === "declined";
  const reasonLabel = data?.declineReason ? DECLINE_REASON_LABELS[data.declineReason] : null;

  const showSearch = !loading && !data;

  return (
    <main className="build-tracking-page" id="main-content" dir={isRtl ? "rtl" : "ltr"}>
      <section className="flex min-h-[calc(100svh-72px)] items-center bg-[#f2f6f4] py-12 md:py-20" aria-labelledby="track-request-title">
        <Container>
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
              <h1 id="track-request-title" className="text-3xl font-bold leading-tight tracking-tight text-brand-dark sm:text-4xl md:text-5xl">
                {interfaceCopy(isRtl, "track_request_content_003")}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-brand-dark/75 md:text-lg">
                {interfaceCopy(isRtl, "track_request_content_004")}
              </p>
            </div>

            <div className="rounded-[14px] border border-brand-dark/12 bg-white p-6 md:p-8">
              {loading ? (
                <div className="flex min-h-44 items-center justify-center gap-3 text-brand-dark/75" role="status" aria-live="polite">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-primary" aria-hidden="true" />
                  <span>{interfaceCopy(isRtl, "track_request_content_005")}</span>
                </div>
              ) : data ? (
                <div aria-live="polite">
                  <div className="flex items-start gap-4 border-b border-brand-dark/10 pb-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf2ee] text-brand-dark">
                      <PackageSearch className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark/70">{interfaceCopy(isRtl, "track_request_content_006")}</p>
                      <p className="mt-1 break-all text-lg font-bold tracking-wide text-brand-dark" dir="ltr">{data.trackingNumber}</p>
                      {data.projectName && <p className="mt-2 text-sm text-brand-dark/75">{data.projectName}</p>}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-semibold text-brand-dark/70">{interfaceCopy(isRtl, "track_request_content_007")}</p>
                    <p className={`mt-2 text-xl font-bold leading-relaxed ${isDeclined ? "text-red-700" : "text-brand-dark"}`}>
                      {statusLabel ? (isRtl ? statusLabel.ar : statusLabel.en) : data.customerStatus}
                    </p>
                    {isDeclined && reasonLabel && (
                      <p className="mt-2 text-sm leading-7 text-red-700/90">{isRtl ? reasonLabel.ar : reasonLabel.en}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setData(null); setError(""); setInput(""); router.push(isRtl ? "/ar/track-request" : "/track-request"); }}
                    className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-dark underline decoration-brand-dark/35 underline-offset-4 transition hover:decoration-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
                  >
                    {interfaceCopy(isRtl, "track_request_content_008")}
                  </button>
                </div>
              ) : showSearch ? (
                <form onSubmit={onSubmit}>
                  <label htmlFor="tracking-number" className="block text-sm font-semibold text-brand-dark">
                    {interfaceCopy(isRtl, "track_request_content_009")}
                  </label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="tracking-number"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={interfaceCopy(isRtl, "track_request_content_010")}
                      dir="ltr"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "tracking-error" : undefined}
                      className="min-h-12 min-w-0 flex-1 rounded-lg border border-brand-dark/20 bg-white px-4 text-center text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 font-bold text-brand-dark transition hover:bg-brand-accent/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
                    >
                      <Search className="h-4 w-4" aria-hidden="true" />
                      {interfaceCopy(isRtl, "track_request_content_011")}
                    </button>
                  </div>
                  {error && (
                    <p id="tracking-error" className="mt-4 flex items-start gap-2 text-sm leading-6 text-red-700" role="alert">
                      <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </p>
                  )}
                </form>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
