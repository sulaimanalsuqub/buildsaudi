"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
      return;
    }

    const adminCheck = await fetch("/api/admin/me", { cache: "no-store" });
    if (!adminCheck.ok) {
      const data = await adminCheck.json().catch(() => null) as { error?: string } | null;
      await supabase.auth.signOut();
      setError(data?.error ?? "تم تسجيل الدخول، لكن هذا الحساب غير مصرح له بالدخول للوحة الإدارة");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EB] p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/brand/logo-ar.svg"
            alt="Build"
            width={4302}
            height={1500}
            className="mx-auto h-[36px] w-auto"
          />
          <p className="mt-3 text-sm text-[#1D3F1F]/60">لوحة إدارة بيلد</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-[20px] border border-[#1D3F1F]/10 bg-white p-6"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#1D3F1F]">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@buildsaudi.com"
                className="w-full rounded-xl border border-[#1D3F1F]/15 bg-[#F4F3EB]/60 px-4 py-3 text-sm text-[#1D3F1F] outline-none transition-all placeholder:text-[#1D3F1F]/35 focus:border-[#09B14B]/50 focus:ring-2 focus:ring-[#09B14B]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#1D3F1F]">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#1D3F1F]/15 bg-[#F4F3EB]/60 px-4 py-3 text-sm text-[#1D3F1F] outline-none transition-all placeholder:text-[#1D3F1F]/35 focus:border-[#09B14B]/50 focus:ring-2 focus:ring-[#09B14B]/15"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#09B14B] py-3 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-60"
            >
              {loading ? "جارٍ الدخول..." : "دخول"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
