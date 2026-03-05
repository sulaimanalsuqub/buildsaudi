import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Build Saudi <noreply@mail.build.com.sa>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "sulaimanalsuqub@gmail.com";
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
  client_email: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: quote.client_email,
    subject: `تم استلام طلبك — ${quote.project_name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">تم استلام طلبك ✓</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${quote.client_name}</strong>،</p>
          <p style="color: #4b5563; line-height: 1.7;">
            تم استلام طلب عرض السعر الخاص بمشروع <strong>${quote.project_name}</strong> بنجاح.
            سيتواصل معك فريق Build Saudi خلال <strong>24 ساعة</strong> بعرض سعر مفصّل.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">المشروع</p>
            <p style="margin: 4px 0 0; font-weight: 600; color: #1D3F1F;">${quote.project_name}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px;">للاستفسار، يمكنك التواصل معنا مباشرةً.</p>
          <p style="margin-top: 24px; color: #4b5563;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
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

// ─────────────────────────────────────────────
//  6. عرض السعر النهائي للعميل (DDP)
// ─────────────────────────────────────────────
export async function sendClientOfferEmail(offer: {
  client_name: string;
  client_email: string;
  project_name: string;
  materials_total: number;
  freight_total: number;
  platform_fee: number;
  grand_total: number;
  validity_days: number;
  offer_token: string;
  delivery_address: string;
  delivery_date: string;
}) {
  const offerUrl = `${BASE_URL}/offer/${offer.offer_token}`;
  const fmt = (n: number) => n.toLocaleString("ar-SA") + " ر.س";

  return resend.emails.send({
    from: FROM,
    to: offer.client_email,
    subject: `عرض سعر جاهز — ${offer.project_name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 620px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 28px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">عرض سعر جاهز لمشروعك ✓</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 14px;">${offer.project_name}</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px; background: #fff;">
          <p style="margin: 0 0 20px; font-size: 15px;">مرحباً <strong>${offer.client_name}</strong>،</p>
          <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
            يسعدنا إبلاغك بأن عرض السعر لمشروع <strong>${offer.project_name}</strong> جاهز الآن.
            يُرجى مراجعته والرد خلال <strong>${offer.validity_days} أيام</strong>.
          </p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px; font-size: 14px; color: #6b7280; font-weight: 600;">تفاصيل العرض</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #4b5563; font-size: 14px;">قيمة المواد والتوريد</td>
                <td style="padding: 10px 0; text-align: left; font-weight: 600; font-size: 14px;" dir="ltr">${fmt(offer.materials_total)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #4b5563; font-size: 14px;">التوصيل والجمارك (DDP)</td>
                <td style="padding: 10px 0; text-align: left; font-weight: 600; font-size: 14px;" dir="ltr">${fmt(offer.freight_total)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #4b5563; font-size: 14px;">رسوم خدمة المنصة</td>
                <td style="padding: 10px 0; text-align: left; font-weight: 600; font-size: 14px;" dir="ltr">${fmt(offer.platform_fee)}</td>
              </tr>
              <tr>
                <td style="padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #1D3F1F;">الإجمالي DDP</td>
                <td style="padding: 14px 0 0; text-align: left; font-size: 18px; font-weight: 700; color: #09B14B;" dir="ltr">${fmt(offer.grand_total)}</td>
              </tr>
            </table>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 28px;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #166534;">📦 عنوان التسليم: <strong>${offer.delivery_address}</strong></p>
            <p style="margin: 0; font-size: 13px; color: #166534;">📅 تاريخ التسليم المطلوب: <strong>${offer.delivery_date}</strong></p>
          </div>
          <a href="${offerUrl}" style="display: block; text-align: center; background: #09B14B; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 16px;">
            مراجعة العرض والرد عليه
          </a>
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 0;">
            صالح لمدة ${offer.validity_days} أيام — ينتهي تلقائياً بعد انتهاء المدة
          </p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
          <p style="color: #6b7280; font-size: 13px; margin: 0;">للاستفسار يرجى التواصل معنا مباشرةً.</p>
          <p style="margin: 12px 0 0; color: #4b5563; font-size: 13px;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}
