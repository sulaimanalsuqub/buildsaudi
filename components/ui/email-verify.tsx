"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";

interface EmailVerifyProps {
  email: string;
  isRtl?: boolean;
  onVerified: (token: string) => void;
}

type VerifyState = "idle" | "sending" | "sent" | "verifying" | "verified";

export function EmailVerify({ email, isRtl = false, onVerified }: EmailVerifyProps) {
  const [state, setState] = useState<VerifyState>("idle");
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (state === "sent") inputRef.current?.focus();
  }, [state]);

  const sendCode = async () => {
    setState("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send" }),
      });
      if (res.ok) {
        setState("sent");
        setCountdown(60);
        setCode("");
      } else {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setState("idle");
        setErrorMsg(data?.error ?? (isRtl ? "فشل إرسال الرمز" : "Failed to send code"));
      }
    } catch {
      setState("idle");
      setErrorMsg(isRtl ? "تعذر الاتصال. تحقق من الإنترنت." : "Connection error. Check your internet.");
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;
    setState("verifying");
    setErrorMsg("");
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "verify", code }),
      });
      const data = await res.json().catch(() => null) as { ok?: boolean; token?: string; error?: string } | null;
      if (res.ok && data?.token) {
        setState("verified");
        onVerified(data.token);
      } else {
        setState("sent");
        setErrorMsg(data?.error ?? (isRtl ? "رمز غير صحيح" : "Invalid code"));
      }
    } catch {
      setState("sent");
      setErrorMsg(isRtl ? "تعذر الاتصال." : "Connection error.");
    }
  };

  if (state === "verified") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        <span className="font-semibold">{isRtl ? "تم التحقق من البريد الإلكتروني ✓" : "Email verified ✓"}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-dark/12 bg-brand-light/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MailCheck className="h-4 w-4 text-brand-primary shrink-0" />
        <p className="text-sm font-semibold text-brand-dark">
          {isRtl ? "تحقق من بريدك الإلكتروني" : "Verify your email"}
        </p>
      </div>

      {state === "idle" || state === "sending" ? (
        <>
          <p className="text-xs text-brand-dark/55 leading-5">
            {isRtl
              ? "سنرسل رمزاً مكوناً من 6 أرقام للتأكد أن البريد صحيح."
              : "We'll send a 6-digit code to confirm your email is real."}
          </p>
          <button
            type="button"
            onClick={sendCode}
            disabled={state === "sending"}
            className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-60"
          >
            {state === "sending" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRtl ? "جارٍ الإرسال..." : "Sending..."}
              </span>
            ) : (
              isRtl ? "إرسال رمز التحقق" : "Send verification code"
            )}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-brand-dark/60 leading-5">
            {isRtl
              ? `أرسلنا رمزاً مكوناً من 6 أرقام إلى ${email}`
              : `We sent a 6-digit code to ${email}`}
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setErrorMsg("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); verifyCode(); } }}
              className="flex-1 rounded-xl border border-brand-dark/20 bg-white px-4 py-2.5 text-center text-xl font-bold tracking-[0.4em] text-brand-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 placeholder:tracking-normal placeholder:text-base placeholder:font-normal placeholder:text-brand-dark/30"
              dir="ltr"
            />
            <button
              type="button"
              onClick={verifyCode}
              disabled={code.length !== 6 || state === "verifying"}
              className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {state === "verifying"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (isRtl ? "تحقق" : "Verify")}
            </button>
          </div>
          {countdown > 0 ? (
            <p className="text-xs text-brand-dark/40">
              {isRtl ? `إعادة الإرسال بعد ${countdown}ث` : `Resend in ${countdown}s`}
            </p>
          ) : (
            <button type="button" onClick={sendCode} className="text-xs font-semibold text-brand-primary hover:underline">
              {isRtl ? "إعادة إرسال الرمز" : "Resend code"}
            </button>
          )}
        </div>
      )}

      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
    </div>
  );
}
