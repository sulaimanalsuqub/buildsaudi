import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "سياسة الخصوصية"
};

export default function ArabicPrivacyPolicyPage() {
  return (
    <main className="py-16" dir="rtl">
      <Container className="max-w-4xl">
        <h1 className="type-section-title text-brand-dark">سياسة الخصوصية</h1>
        <p className="type-body mt-5 text-brand-dark/80">
          تقوم بيلد بمعالجة بيانات الشركات والمنتجات لربط الموردين بفرص توريد فعلية للمشاريع وإدارة مسار التوريد. نجمع البيانات الضرورية فقط ونستخدمها لتشغيل المنصة بكفاءة.
        </p>
        <p className="type-body mt-4 text-brand-dark/80">
          يحق للشركات طلب تصحيح البيانات غير الدقيقة، وتلتزم المنصة بتطبيق ضوابط تقنية وتنظيمية لحماية معلومات الأعمال وفق متطلبات السوق السعودي.
        </p>
      </Container>
    </main>
  );
}
