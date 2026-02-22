import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "الشروط والأحكام"
};

export default function ArabicTermsPage() {
  return (
    <main className="section-pad" dir="rtl">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">الشروط والأحكام</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              باستخدام بيلد، فإنك تقر بصحة بيانات الشركة والمنتجات المقدمة وأن لديك الصلاحية لرفعها. قد تطلب المنصة معلومات إضافية للتحقق من قدرة التوريد وملاءمة المشاريع.
            </p>
            <p className="type-body text-brand-dark/80">
              تحتفظ بيلد بحق تعليق الوصول عند وجود بيانات غير صحيحة أو إساءة استخدام أو مخالفة للأنظمة المعمول بها. وقد يتم تحديث هذه الشروط بشكل دوري.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
