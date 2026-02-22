import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "سياسة ملفات الارتباط"
};

export default function ArabicCookiesPolicyPage() {
  return (
    <main className="py-16" dir="rtl">
      <Container className="max-w-4xl">
        <h1 className="type-section-title text-brand-dark">سياسة ملفات الارتباط</h1>
        <p className="type-body mt-5 text-brand-dark/80">
          تستخدم بيلد ملفات ارتباط أساسية لضمان استمرارية الجلسة وحماية الحساب وتحسين الأداء. لا نستخدم أدوات تتبع غير أساسية دون إشعار واضح.
        </p>
        <p className="type-body mt-4 text-brand-dark/80">
          يمكنك إدارة إعدادات ملفات الارتباط من المتصفح، لكن تعطيل الملفات الأساسية قد يؤثر على عمل نموذج التسجيل والوصول إلى المنصة.
        </p>
      </Container>
    </main>
  );
}
