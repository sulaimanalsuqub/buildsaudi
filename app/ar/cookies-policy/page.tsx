import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/cookies-policy",
  title: "سياسة ملفات الارتباط | بيلد",
  description:
    "توضح هذه السياسة أنواع ملفات الارتباط (الكوكيز) المستخدمة في موقع بيلد وأغراضها، بما يتوافق مع نظام حماية البيانات الشخصية السعودي، وكيفية إدارة تفضيلاتك.",
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="type-section-title !mt-10 text-brand-dark first:!mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-brand-dark/80">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pr-5 type-body text-brand-dark/80">{children}</ul>;
}

export default function ArabicCookiesPolicyPage() {
  return (
    <LegalPageContent title="سياسة ملفات الارتباط" badge="السياسات" isRtl>
      <P>
        تستخدم بيلد ملفات ارتباط (كوكيز) لتشغيل الموقع وتحسين تجربتك. توضح هذه السياسة أنواع الملفات المستخدمة والغرض من كل نوع، بما يتوافق مع نظام حماية البيانات الشخصية.
      </P>

      <H2>1. ملفات الارتباط الأساسية</H2>
      <P>
        ضرورية لتشغيل الموقع ولا يمكن تعطيلها. تُستخدم للحفاظ على الجلسة أثناء تعبئة نماذج التسجيل أو طلب التوريد، وحماية النماذج من إساءة الاستخدام، وتذكر تفضيلات أساسية. تعطيلها يعطّل إرسال النماذج والوظائف الأساسية للموقع.
      </P>

      <H2>2. ملفات الارتباط التحليلية</H2>
      <P>
        نستخدم أدوات تحليل مثل Google Analytics (عبر Google Tag Manager) لفهم كيفية استخدام الزوار للموقع وتحسين الخدمة. هذه الملفات غير ضرورية لتشغيل الموقع، ويتم استخدامها بموجب موافقتك.
      </P>

      <H2>3. ملفات ارتباط الحماية الأمنية</H2>
      <P>
        نستخدم Cloudflare Turnstile للتحقق من أن الطلبات المرسلة عبر النماذج ليست من برامج آلية (بوتات)، وهذا جزء أساسي من حماية بياناتك وبيانات المنصة من إساءة الاستخدام.
      </P>

      <H2>4. إدارة تفضيلاتك</H2>
      <P>
        يمكنك إدارة أو تعطيل ملفات الارتباط غير الأساسية من خلال إعدادات المتصفح لديك. قد يؤثر تعطيل ملفات الارتباط الأساسية على قدرتك على إرسال النماذج أو استخدام وظائف الموقع الرئيسية.
      </P>

      <H2>5. مزودو الخدمة</H2>
      <Ul>
        <li><strong>Google (Tag Manager / Analytics):</strong> تحليل استخدام الموقع.</li>
        <li><strong>Cloudflare (Turnstile):</strong> الحماية من الطلبات الآلية المسيئة.</li>
      </Ul>

      <P>لأي استفسار حول ملفات الارتباط، راسلنا على <span dir="ltr">cs@build.sa</span>. آخر تحديث: يوليو 2026.</P>
    </LegalPageContent>
  );
}
