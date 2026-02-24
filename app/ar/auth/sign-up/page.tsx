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

export default function ArabicSignUpPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!company || !email || !password) {
      setError("يرجى تعبئة جميع الحقول.");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { company_name: company } },
    });
    setLoading(false);
    if (authError) {
      setError("حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell
      isRtl
      backLabel="العودة للرئيسية"
      title="أنشئ حساب شركتك في بيلد"
      subtitle="أنشئ حسابًا مؤسسيًا لبدء إرسال طلبات التوريد وإدارة مشاريعك."
    >
      <Card>
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
          <CardDescription>استخدم بيانات شركتك للتسجيل بشكل آمن.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit} dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="company">اسم الشركة</Label>
              <Input
                id="company"
                placeholder="شركة بيلد للتوريد"
                className="h-11 text-base"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني الرسمي</Label>
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
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="8 أحرف على الأقل"
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
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="type-small text-brand-dark/70">
            لديك حساب بالفعل؟{" "}
            <Link href="/ar/auth/sign-in" className="font-semibold text-brand-dark hover:text-brand-primary">
              تسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
