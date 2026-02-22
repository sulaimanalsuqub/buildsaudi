import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "سياسة الخصوصية"
};

export default function ArabicPrivacyPolicyPage() {
  return (
    <main className="section-pad" dir="rtl">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">سياسة الخصوصية</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              تقوم بيلد بمعالجة بيانات الشركات والمنتجات لربط الموردين بفرص توريد فعلية للمشاريع وإدارة مسار التوريد. نجمع البيانات الضرورية فقط ونستخدمها لتشغيل المنصة بكفاءة.
            </p>
            <p className="type-body text-brand-dark/80">
              يحق للشركات طلب تصحيح البيانات غير الدقيقة، وتلتزم المنصة بتطبيق ضوابط تقنية وتنظيمية لحماية معلومات الأعمال وفق متطلبات السوق السعودي.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
