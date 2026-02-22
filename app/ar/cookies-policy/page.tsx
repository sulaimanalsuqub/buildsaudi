import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "سياسة ملفات الارتباط"
};

export default function ArabicCookiesPolicyPage() {
  return (
    <main className="section-pad" dir="rtl">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">سياسة ملفات الارتباط</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              تستخدم بيلد ملفات ارتباط أساسية لضمان استمرارية الجلسة وحماية الحساب وتحسين الأداء. لا نستخدم أدوات تتبع غير أساسية دون إشعار واضح.
            </p>
            <p className="type-body text-brand-dark/80">
              يمكنك إدارة إعدادات ملفات الارتباط من المتصفح، لكن تعطيل الملفات الأساسية قد يؤثر على عمل المنصة والوصول إلى الحساب.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
