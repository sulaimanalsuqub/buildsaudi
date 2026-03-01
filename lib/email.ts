import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// TODO: بعد توثيق الدومين في Resend، غيّر هذا إلى: "Build Saudi <noreply@build.sa>"
const FROM = "Build Saudi <onboarding@resend.dev>";
const ADMIN_EMAIL = "sulaimanalsuqub@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.build.sa";

// ─────────────────────────────────────────────
//  1. إشعار الأدمن — طلب تسعير جديد
// ─────────────────────────────────────────────
export async function sendNewQuoteNotification(quote: {
  id: string;
  project_name: string;
  client_name: string;
  phone: string;
  delivery_address: string;
  materials: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `طلب تسعير جديد — ${quote.project_name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">طلب تسعير جديد</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">المشروع</td><td style="padding: 8px 0; font-weight: 600;">${quote.project_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">العميل</td><td style="padding: 8px 0;">${quote.client_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">الجوال</td><td style="padding: 8px 0;" dir="ltr">${quote.phone}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">التسليم</td><td style="padding: 8px 0;">${quote.delivery_address}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">المواد</td><td style="padding: 8px 0;">${quote.materials}</td></tr>
          </table>
          <div style="margin-top: 24px;">
            <a href="${BASE_URL}/admin/quotes/${quote.id}"
               style="background: #09B14B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              عرض الطلب
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
//  2. تأكيد للعميل — استلام طلبه
// ─────────────────────────────────────────────
export async function sendQuoteConfirmationToClient(quote: {
  project_name: string;
  client_name: string;
  phone: string;
}) {
  // نرسل للأدمن فقط — العميل ليس عنده إيميل في النموذج الحالي
  // هذه الدالة جاهزة للاستخدام لاحقاً عند إضافة حقل إيميل للعميل
  return Promise.resolve({ skipped: "no client email field yet" });
}

// ─────────────────────────────────────────────
//  3. رابط توقيع العقد للمورد
// ─────────────────────────────────────────────
export async function sendContractSignLink(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  token: string;
  contractTitle: string;
}) {
  const signUrl = `${BASE_URL}/vendor/sign/${vendor.token}`;

  return resend.emails.send({
    from: FROM,
    to: vendor.email,
    subject: `طلب توقيع عقد — ${vendor.contractTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">طلب توقيع عقد</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${vendor.manager_name}</strong> / ${vendor.establishment_name}،</p>
          <p style="color: #4b5563;">يرجى مراجعة عقد الشراكة مع Build Saudi والموافقة عليه من خلال الرابط أدناه.</p>
          <p style="color: #4b5563;">العقد: <strong>${vendor.contractTitle}</strong></p>
          <div style="margin-top: 24px;">
            <a href="${signUrl}"
               style="background: #09B14B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              مراجعة العقد والتوقيع
            </a>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            إذا لم تتمكن من فتح الزر، انسخ هذا الرابط:<br/>
            <span dir="ltr">${signUrl}</span>
          </p>
        </div>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
//  4. إشعار المورد — تفعيل الحساب
// ─────────────────────────────────────────────
export async function sendVendorActivatedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: vendor.email,
    subject: "تم تفعيل حسابك كمورد — Build Saudi",
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #09B14B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">✓ تم تفعيل حسابك</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${vendor.manager_name}</strong> / ${vendor.establishment_name}،</p>
          <p style="color: #4b5563;">
            يسعدنا إبلاغكم بأن حساب منشأتكم كمورد معتمد في منصة Build Saudi قد تم تفعيله.
            سنتواصل معكم قريباً عند توفر فرص مناسبة.
          </p>
          <p style="margin-top: 24px; color: #4b5563;">شكراً لثقتكم بنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
//  5. إشعار المورد — رفض الحساب
// ─────────────────────────────────────────────
export async function sendVendorRejectedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: vendor.email,
    subject: "بخصوص طلب الانضمام — Build Saudi",
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">بخصوص طلب انضمامكم</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${vendor.manager_name}</strong> / ${vendor.establishment_name}،</p>
          <p style="color: #4b5563;">
            نشكركم على اهتمامكم بالانضمام إلى شبكة موردي Build Saudi.
            للأسف، لم نتمكن من قبول طلبكم في الوقت الحالي.
          </p>
          <p style="color: #4b5563;">للاستفسار، يرجى التواصل معنا عبر البريد الإلكتروني.</p>
          <p style="margin-top: 24px; color: #4b5563;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}
