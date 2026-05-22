import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "سياسة ملفات الارتباط",
  description: "سياسة ملفات الارتباط الخاصة بموقع بيلد."
};

export default function ArabicCookiesPolicyPage() {
  return (
    <main className="section-pad" dir="rtl">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">سياسة ملفات الارتباط</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              تستخدم بيلد ملفات ارتباط أساسية للإبقاء على الجلسة فعالة وحماية النماذج وتذكر بعض التفضيلات الأساسية. وقد نستخدم أيضًا ملفات تحليلات لفهم الاستخدام وتحسين الخدمة عند الإفصاح عنها.
            </p>
            <p className="type-body text-brand-dark/80">
              يمكنك إدارة ملفات الارتباط من خلال إعدادات المتصفح. وقد يؤثر تعطيل الملفات الأساسية على إرسال النماذج أو تسجيل الدخول أو الوظائف الأساسية الأخرى.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
