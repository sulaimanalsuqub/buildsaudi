"use client";

import { useState } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ArabicForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // TODO: connect Supabase resetPasswordForEmail here
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

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
          {sent ? (
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-5 text-center">
              <p className="text-2xl">📬</p>
              <p className="type-small mt-2 font-semibold text-brand-dark">تحقق من بريدك الإلكتروني</p>
              <p className="type-small mt-1 text-brand-dark/60">
                تم إرسال رابط الاستعادة إلى <strong>{email}</strong>
              </p>
            </div>
          ) : (
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
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark"
              >
                {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
              </Button>
            </form>
          )}
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
