import { Metadata } from "next";

import { LegalPageContent } from "@/components/sections/legal-page-content";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لتسجيل الموردين وطلبات المشاريع في بيلد.",
};

export default function ArabicPrivacyPolicyPage() {
  return (
    <LegalPageContent title="سياسة الخصوصية" badge="السياسات" isRtl>
      <p className="type-body text-brand-dark/80">
        تجمع بيلد فقط البيانات اللازمة لتسجيل الموردين واستقبال طلبات المشاريع ومراجعة الأهلية وإدارة التواصل، وذلك بما يتوافق مع مبدأ تقليل البيانات إلى الحد الأدنى المطلوب لغرض محدد.
      </p>
      <p className="type-body text-brand-dark/80">
        قد نجمع اسم المنشأة وبيانات التواصل والسجل التجاري وفئات المنتجات وموقع التسليم والملفات المرفوعة وبيانات الاستخدام الأساسية للموقع. نستخدم هذه البيانات لتشغيل الخدمة وتحسينها والحفاظ على الأمان.
      </p>
      <p className="type-body text-brand-dark/80">
        لا نشارك البيانات إلا عند الحاجة لتقديم الخدمة أو الامتثال للأنظمة أو بعد الإشعار المناسب. ويحق لكم طلب الوصول إلى البيانات أو تصحيحها أو تحديثها عند وجود معلومات غير دقيقة.
      </p>
      <p className="type-body text-brand-dark/80">
        نحتفظ بالبيانات للمدة اللازمة للغرض المعلن فقط، ونطبق ضوابط تقنية وتنظيمية معقولة للحماية، وقد نقوم بتحديث هذه السياسة عند تغير ممارسات المعالجة.
      </p>
    </LegalPageContent>
  );
}
