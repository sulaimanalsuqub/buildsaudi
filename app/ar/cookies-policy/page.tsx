import { Metadata } from "next";

import { LegalPageContent } from "@/components/sections/legal-page-content";

export const metadata: Metadata = {
  title: "سياسة ملفات الارتباط",
  description: "سياسة ملفات الارتباط الخاصة بموقع بيلد.",
};

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
