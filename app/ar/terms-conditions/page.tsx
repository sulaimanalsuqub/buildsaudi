import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description: "شروط استخدام بيلد الخاصة بتسجيل الموردين وطلبات المشاريع."
};

export default function ArabicTermsPage() {
  return (
    <main className="section-pad" dir="rtl">
      <Container>
        <article className="surface-card mx-auto max-w-[920px] p-6 md:p-10">
          <h1 className="type-section-title text-brand-dark">الشروط والأحكام</h1>
          <div className="content-stack mt-8">
            <p className="type-body text-brand-dark/80">
              باستخدام بيلد، فإنك تقر بأن بيانات الشركة والملفات التي ترفعها صحيحة وحديثة، وأن لديك الصلاحية لتقديمها نيابة عن المنشأة.
            </p>
            <p className="type-body text-brand-dark/80">
              قد تطلب بيلد معلومات إضافية للتحقق من أهلية المورد وملاءمة الطلبات ومناطق التغطية. ويجوز لنا تعليق الوصول عند وجود بيانات غير صحيحة أو سوء استخدام أو مخالفة للأنظمة المعمول بها.
            </p>
            <p className="type-body text-brand-dark/80">
              تخضع هذه الشروط للأنظمة المعمول بها في المملكة العربية السعودية، بما في ذلك نظام حماية البيانات الشخصية والمتطلبات التنظيمية ذات الصلة. وقد يتم تحديث هذه الشروط من وقت لآخر.
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
