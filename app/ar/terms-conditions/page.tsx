import { Metadata } from "next";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "الشروط والأحكام"
};

export default function ArabicTermsPage() {
  return (
    <main className="py-16" dir="rtl">
      <Container className="max-w-4xl">
        <h1 className="type-section-title text-brand-dark">الشروط والأحكام</h1>
        <p className="type-body mt-5 text-brand-dark/80">
          بإرسال بيانات المورد عبر بيلد، فأنت تقر بصحة المعلومات والوثائق المقدمة وأن لديك الصلاحية النظامية لإرسالها. قد تطلب المنصة مستندات إضافية قبل التفعيل النهائي.
        </p>
        <p className="type-body mt-4 text-brand-dark/80">
          تحتفظ بيلد بحق تعليق أو رفض الطلبات في حال وجود بيانات غير صحيحة أو مخالفات امتثال أو إساءة استخدام للمنصة. وقد يتم تحديث هذه الشروط بشكل دوري.
        </p>
      </Container>
    </main>
  );
}
