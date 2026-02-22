import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
  description: "إعادة تعيين كلمة المرور لحساب بيلد"
};

export default function ArabicForgotPasswordPage() {
  return (
    <AuthShell
      isRtl
      backLabel="العودة للرئيسية"
      title="استعادة كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور."
    >
      <Card>
        <CardHeader>
          <CardTitle>نسيت كلمة المرور</CardTitle>
          <CardDescription>سنرسل تعليمات الاستعادة إلى بريدك الإلكتروني.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-11 text-base" />
            </div>
            <Button type="submit" size="lg" className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark">
              إرسال رابط الاستعادة
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="type-small text-brand-dark/70">
            تذكرت كلمة المرور؟{" "}
            <Link href="/ar/auth/sign-in" className="font-semibold text-brand-dark hover:text-brand-primary">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
