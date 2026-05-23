"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF7] p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/brand/logo-ar.svg"
            alt="Build"
            width={4302}
            height={1500}
            className="mx-auto h-[36px] w-auto"
          />
          <p className="mt-3 text-sm text-brand-dark/60">لوحة إدارة بيلد</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-brand-dark/10 bg-white p-6 shadow-[0_18px_54px_rgba(29,63,31,0.08)]"
        >
          <div className="mb-5 flex items-center gap-3 border-b border-brand-dark/10 pb-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold text-brand-dark">تسجيل الدخول</h1>
              <p className="text-sm text-brand-dark/55">للمستخدمين المصرح لهم فقط</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@buildsaudi.com"
                className="w-full rounded-lg border border-brand-dark/15 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition-all placeholder:text-brand-dark/35 focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-brand-dark/15 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition-all placeholder:text-brand-dark/35 focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/15"
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
              className="w-full rounded-lg bg-brand-dark py-3 text-sm font-semibold text-white transition-all hover:bg-brand-primary disabled:opacity-60"
            >
              {loading ? "جارٍ الدخول..." : "دخول"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
