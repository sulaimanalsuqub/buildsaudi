import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/cookies-policy",
  title: "سياسة ملفات الارتباط | بيلد",
  description:
    "توضح هذه السياسة أنواع ملفات الارتباط المستخدمة في موقع بيلد وأغراضها، وكيفية إدارة تفضيلاتك المتعلقة بها.",
});

export default function ArabicCookiesPolicyPage() {
  return (
    <LegalPageContent title="سياسة ملفات الارتباط" badge="السياسات" isRtl>
      <p className="type-body text-brand-dark/80">
        تستخدم بيلد ملفات ارتباط أساسية للإبقاء على الجلسة فعالة وحماية النماذج وتذكر بعض التفضيلات الأساسية. وقد نستخدم أيضًا ملفات تحليلات لفهم الاستخدام وتحسين الخدمة عند الإفصاح عنها.
      </p>
      <p className="type-body text-brand-dark/80">
        يمكنك إدارة ملفات الارتباط من خلال إعدادات المتصفح. وقد يؤثر تعطيل الملفات الأساسية على إرسال النماذج أو تسجيل الدخول أو الوظائف الأساسية الأخرى.
      </p>
    </LegalPageContent>
  );
}
