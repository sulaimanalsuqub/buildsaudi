import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/privacy-policy",
  title: "سياسة الخصوصية | بيلد",
  description:
    "توضح هذه السياسة كيفية تعامل بيلد مع بيانات العملاء والموردين عند طلب توريد مواد البناء أو التسجيل، والتزامنا بحماية المعلومات وفق الأنظمة المعمول بها في المملكة.",
});

export default function ArabicPrivacyPolicyPage() {
  return (
    <LegalPageContent title="سياسة الخصوصية" badge="السياسات" isRtl>
      <p className="type-body text-brand-dark/80">
        تجمع بيلد فقط البيانات اللازمة لتسجيل الموردين واستقبال طلبات المشاريع ومراجعة الأهلية وإدارة التواصل، وذلك بما يتوافق مع مبدأ تقليل البيانات إلى الحد الأدنى المطلوب لغرض محدد.
      </p>
      <p className="type-body text-brand-dark/80">
        لا نبيع بياناتك لأطراف ثالثة. يجوز مشاركة البيانات الضرورية فقط مع مزودي الخدمات الذين يساعدوننا في تشغيل خدمات التوريد والتواصل، وذلك بموجب التزامات سرية ومعالجة محدودة.
      </p>
      <p className="type-body text-brand-dark/80">
        يمكنك التواصل معنا لطلب الوصول إلى بياناتك أو تصحيحها أو حذفها ضمن ما يسمح به النظام والالتزامات التعاقدية.
      </p>
    </LegalPageContent>
  );
}