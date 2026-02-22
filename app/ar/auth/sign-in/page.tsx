import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "الدخول إلى حساب بيلد"
};

export default function ArabicSignInPage() {
  return (
    <AuthShell
      isRtl
      backLabel="العودة للرئيسية"
      title="سجّل الدخول إلى حسابك في بيلد"
      subtitle="ادخل إلى لوحة التحكم لمتابعة الطلبات والفرص وإدارة حساب شركتك."
    >
      <Card>
        <CardHeader>
          <CardTitle>مرحبًا بعودتك</CardTitle>
          <CardDescription>أدخل بيانات الدخول للمتابعة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link href="/ar/auth/forgot-password" className="type-small text-brand-dark/70 hover:text-brand-dark">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" className="h-11 text-base" />
            </div>
            <Button type="submit" size="lg" className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark">
              تسجيل الدخول
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
