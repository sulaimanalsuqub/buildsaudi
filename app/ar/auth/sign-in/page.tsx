"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ArabicSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى تعبئة جميع الحقول.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell
      isRtl
      backLabel="العودة للرئيسية"
      title="سجّل الدخول إلى حسابك في بيلد"
      subtitle="ادخل إلى لوحة التحكم لمتابعة الطلبات وعروض الأسعار وإدارة عمليات التوريد."
    >
      <Card>
        <CardHeader>
          <CardTitle>مرحبًا بعودتك</CardTitle>
          <CardDescription>أدخل بيانات الدخول للمتابعة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit} dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="h-11 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link href="/ar/auth/forgot-password" className="type-small text-brand-dark/70 hover:text-brand-dark">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="type-small rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="type-small text-brand-dark/70">
            لا تملك حسابًا؟{" "}
            <Link href="/ar/auth/sign-up" className="font-semibold text-brand-dark hover:text-brand-primary">
              إنشاء حساب
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
