import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "إنشاء حساب جديد في بيلد"
};

export default function ArabicSignUpPage() {
  return (
    <AuthShell
      isRtl
      backLabel="العودة للرئيسية"
      title="أنشئ حساب شركتك في بيلد"
      subtitle="أنشئ حسابًا مؤسسيًا للوصول إلى فرص التوريد وإدارة عملياتك من مكان واحد."
    >
      <Card>
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
          <CardDescription>استخدم بيانات شركتك للتسجيل بشكل آمن.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الشركة</Label>
              <Input id="name" placeholder="شركة بيلد للتوريد" className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني الرسمي</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" placeholder="أنشئ كلمة مرور قوية" className="h-11 text-base" />
            </div>
            <Button type="submit" size="lg" className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark">
              إنشاء الحساب
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
