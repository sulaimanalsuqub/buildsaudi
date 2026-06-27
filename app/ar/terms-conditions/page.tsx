import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/terms-conditions",
  title: "الشروط والأحكام | بيلد",
  description:
    "تحدد هذه الشروط حقوق والتزامات المستخدمين عند طلب توريد مواد البناء أو التسجيل في خدمات بيلد، وفق الأحكام والشروط المعتمدة في المملكة.",
});

export default function ArabicTermsPage() {
  return (
    <LegalPageContent title="الشروط والأحكام" badge="السياسات" isRtl>
      <p className="type-body text-brand-dark/80">
        باستخدام بيلد، فإنك تقر بأن بيانات الشركة والملفات التي ترفعها صحيحة وحديثة، وأن لديك الصلاحية لتقديمها نيابة عن المنشأة.
      </p>
      <p className="type-body text-brand-dark/80">
        قد تطلب بيلد معلومات إضافية للتحقق من أهلية المورد وملاءمة الطلبات ومناطق التغطية. ويجوز لنا تعليق الوصول عند وجود بيانات غير صحيحة أو سوء استخدام أو مخالفة للأنظمة المعمول بها.
      </p>
      <p className="type-body text-brand-dark/80">
        تخضع هذه الشروط للأنظمة المعمول بها في المملكة العربية السعودية، بما في ذلك نظام حماية البيانات الشخصية والمتطلبات التنظيمية ذات الصلة. وقد يتم تحديث هذه الشروط من وقت لآخر.
      </p>
    </LegalPageContent>
  );
}
