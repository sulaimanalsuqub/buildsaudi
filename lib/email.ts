import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Build Saudi <noreply@mail.build.com.sa>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.build.sa"
).replace(/\/$/, "");

// تحصين HTML لمنع XSS
function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// تحصين الروابط — منع javascript: و data: protocols
function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return "#";
    }
    return url;
  } catch {
    return "#";
  }
}

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
  return getResend().emails.send({
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
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">المشروع</td><td style="padding: 8px 0; font-weight: 600;">${esc(quote.project_name)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">العميل</td><td style="padding: 8px 0;">${esc(quote.client_name)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">الجوال</td><td style="padding: 8px 0;" dir="ltr">${esc(quote.phone)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">التسليم</td><td style="padding: 8px 0;">${esc(quote.delivery_address)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">المواد</td><td style="padding: 8px 0;">${esc(quote.materials)}</td></tr>
          </table>
          <div style="margin-top: 24px;">
            <a href="${safeUrl(`${BASE_URL}/admin/quotes/${quote.id}`)}"
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
  return getResend().emails.send({
    from: FROM,
    to: quote.client_email,
    subject: `تم استلام طلبك — ${quote.project_name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">تم استلام طلبك ✓</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${esc(quote.client_name)}</strong>،</p>
          <p style="color: #4b5563; line-height: 1.7;">
            تم استلام طلب عرض السعر الخاص بمشروع <strong>${esc(quote.project_name)}</strong> بنجاح.
            سيتواصل معك فريق Build Saudi خلال <strong>24 ساعة</strong> بعرض سعر مفصّل.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">المشروع</p>
            <p style="margin: 4px 0 0; font-weight: 600; color: #1D3F1F;">${esc(quote.project_name)}</p>
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
  const signUrl = safeUrl(`${BASE_URL}/vendor/sign/${vendor.token}`);

  return getResend().emails.send({
    from: FROM,
    to: vendor.email,
    subject: `طلب توقيع عقد — ${vendor.contractTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">طلب توقيع عقد</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${esc(vendor.manager_name)}</strong> / ${esc(vendor.establishment_name)}،</p>
          <p style="color: #4b5563;">يرجى مراجعة عقد الشراكة مع Build Saudi والموافقة عليه من خلال الرابط أدناه.</p>
          <p style="color: #4b5563;">العقد: <strong>${esc(vendor.contractTitle)}</strong></p>
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
  return getResend().emails.send({
    from: FROM,
    to: vendor.email,
    subject: "تم تفعيل حسابك كمورد — Build Saudi",
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #09B14B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">✓ تم تفعيل حسابك</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${esc(vendor.manager_name)}</strong> / ${esc(vendor.establishment_name)}،</p>
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
  return getResend().emails.send({
    from: FROM,
    to: vendor.email,
    subject: "بخصوص طلب الانضمام — Build Saudi",
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">بخصوص طلب انضمامكم</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${esc(vendor.manager_name)}</strong> / ${esc(vendor.establishment_name)}،</p>
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
//  6. طلب عرض سعر للمورد (RFQ)
// ─────────────────────────────────────────────
export async function sendRfqToVendor(params: {
  vendorName: string;
  managerName: string;
  vendorEmail: string;
  rfqId: string;
  projectName: string;
  deliveryAddress: string;
  deliveryDate: string;
  deadline: string;
  items: { name: string; quantity: number; unit: string; category?: string; description?: string | null }[];
  notes?: string | null;
}) {
  const itemRows = params.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 8px 12px; font-size: 13px; color: #1D3F1F;">${esc(item.name)}</td>
        <td style="padding: 8px 12px; text-align: center; font-size: 13px; font-weight: 600;">${esc(String(item.quantity))}</td>
        <td style="padding: 8px 12px; font-size: 13px; color: #4b5563;">${esc(item.unit)}</td>
        <td style="padding: 8px 12px; font-size: 13px; color: #6b7280;">${esc(item.description) || "—"}</td>
      </tr>`
    )
    .join("");

  return getResend().emails.send({
    from: FROM,
    to: params.vendorEmail,
    subject: `طلب عرض سعر — ${params.projectName}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 620px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 28px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">طلب عرض سعر</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 14px;">${params.projectName}</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px; background: #fff;">
          <p style="margin: 0 0 20px; font-size: 15px;">مرحباً <strong>${esc(params.managerName)}</strong> / ${esc(params.vendorName)}،</p>
          <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
            نرجو التكرم بتزويدنا بعرض سعر للمواد المذكورة أدناه لمشروع <strong>${esc(params.projectName)}</strong>.
          </p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">📍 عنوان التسليم: <strong style="color: #1D3F1F;">${esc(params.deliveryAddress)}</strong></p>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">📅 تاريخ التسليم المطلوب: <strong style="color: #1D3F1F;">${esc(params.deliveryDate)}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600;">الصنف</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600;">الكمية</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600;">الوحدة</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600;">الوصف</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 14px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">⏰ <strong>الموعد النهائي للرد: ${params.deadline}</strong></p>
          </div>

          ${
            params.notes
              ? `<div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
                   <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">ملاحظات إضافية:</p>
                   <p style="margin: 0; font-size: 13px; color: #1D3F1F;">${esc(params.notes)}</p>
                 </div>`
              : ""
          }

          <p style="color: #4b5563; font-size: 13px; line-height: 1.7; margin: 0 0 24px;">
            يُرجى الرد على هذا البريد الإلكتروني مباشرةً بعرض سعركم متضمناً: السعر الإجمالي، مدة التوريد، وأي شروط خاصة.
          </p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">رقم طلب العرض: <span dir="ltr">${params.rfqId.split("-")[0]}</span></p>
          <p style="margin: 12px 0 0; color: #4b5563; font-size: 13px;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
//  7. عرض السعر النهائي للعميل (DDP)
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
  const offerUrl = safeUrl(`${BASE_URL}/offer/${offer.offer_token}`);
  const fmt = (n: number) => n.toLocaleString("ar-SA") + " ر.س";

  return getResend().emails.send({
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
          <p style="margin: 0 0 20px; font-size: 15px;">مرحباً <strong>${esc(offer.client_name)}</strong>،</p>
          <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
            يسعدنا إبلاغك بأن عرض السعر لمشروع <strong>${esc(offer.project_name)}</strong> جاهز الآن.
            يُرجى مراجعته والرد خلال <strong>${esc(String(offer.validity_days))} أيام</strong>.
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
            <p style="margin: 0 0 6px; font-size: 13px; color: #166534;">📦 عنوان التسليم: <strong>${esc(offer.delivery_address)}</strong></p>
            <p style="margin: 0; font-size: 13px; color: #166534;">📅 تاريخ التسليم المطلوب: <strong>${esc(offer.delivery_date)}</strong></p>
          </div>
          <a href="${offerUrl}" style="display: block; text-align: center; background: #09B14B; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 16px;">
            مراجعة العرض والرد عليه
          </a>
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 0;">
            صالح لمدة ${esc(String(offer.validity_days))} أيام — ينتهي تلقائياً بعد انتهاء المدة
          </p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
          <p style="color: #6b7280; font-size: 13px; margin: 0;">للاستفسار يرجى التواصل معنا مباشرةً.</p>
          <p style="margin: 12px 0 0; color: #4b5563; font-size: 13px;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
//  8. إشعار العميل — تحديث حالة الطلب
// ─────────────────────────────────────────────
const STATUS_CLIENT_MAP: Record<string, { subject: string; title: string; message: string; color: string }> = {
  admin_approved: {
    subject: "طلبك تحت المعالجة",
    title: "طلبك قيد المعالجة",
    message: "تم مراجعة طلبك والموافقة عليه. نعمل الآن على تجهيز عروض الأسعار من الموردين المعتمدين وسنوافيك بالعرض النهائي في أقرب وقت.",
    color: "#09B14B",
  },
  payment_pending: {
    subject: "بانتظار تأكيد الدفع",
    title: "بانتظار الدفع",
    message: "شكراً لموافقتك على العرض. يُرجى إتمام عملية الدفع حتى نتمكن من البدء بتجهيز طلبك.",
    color: "#f59e0b",
  },
  payment_confirmed: {
    subject: "تم تأكيد الدفع",
    title: "تم تأكيد الدفع ✓",
    message: "تم استلام وتأكيد الدفع بنجاح. سنبدأ بتجهيز طلبك وشحنه في أقرب وقت.",
    color: "#09B14B",
  },
  in_delivery: {
    subject: "طلبك في الطريق",
    title: "طلبك في الطريق إليك",
    message: "تم شحن طلبك وهو في الطريق إلى موقع التسليم. سنوافيك بالتفاصيل عند الوصول.",
    color: "#3b82f6",
  },
  done: {
    subject: "تم تسليم طلبك بنجاح",
    title: "تم التسليم ✓",
    message: "تم تسليم طلبك بنجاح إلى الموقع المحدد. شكراً لثقتك في Build Saudi ونتطلع للتعاون معك مجدداً.",
    color: "#09B14B",
  },
  cancelled: {
    subject: "تم إلغاء الطلب",
    title: "تم إلغاء الطلب",
    message: "نود إبلاغك بأنه تم إلغاء طلبك. إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.",
    color: "#ef4444",
  },
};

export function getClientNotifiableStatuses(): string[] {
  return Object.keys(STATUS_CLIENT_MAP);
}

export async function sendQuoteStatusToClient(params: {
  client_name: string;
  client_email: string;
  project_name: string;
  status: string;
}) {
  const config = STATUS_CLIENT_MAP[params.status];
  if (!config) return null;

  return getResend().emails.send({
    from: FROM,
    to: params.client_email,
    subject: `${config.subject} — ${params.project_name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: ${config.color}; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${config.title}</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${esc(params.client_name)}</strong>،</p>
          <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px;">${config.message}</p>
          <div style="background: #f9fafb; border-radius: 10px; padding: 16px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">المشروع</p>
            <p style="margin: 0; font-weight: 600; color: #1D3F1F;">${esc(params.project_name)}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">للاستفسار، يمكنك التواصل معنا مباشرةً.</p>
          <p style="margin: 12px 0 0; color: #4b5563; font-size: 13px;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
//  9. تأكيد تسجيل المورد
// ─────────────────────────────────────────────
export async function sendVendorRegistrationConfirmation(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to: vendor.email,
    subject: "تم استلام طلب انضمامكم — Build Saudi",
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: #1D3F1F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">تم استلام طلب انضمامكم ✓</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">مرحباً <strong>${esc(vendor.manager_name)}</strong> / ${esc(vendor.establishment_name)}،</p>
          <p style="color: #4b5563; line-height: 1.7;">
            شكراً لاهتمامكم بالانضمام إلى شبكة موردي Build Saudi.
            تم استلام طلبكم وسيتم مراجعته من قبل فريقنا. سنوافيكم بالنتيجة في أقرب وقت.
          </p>
          <p style="margin-top: 24px; color: #4b5563;">مع تحياتنا،<br/>فريق Build Saudi</p>
        </div>
      </div>
    `,
  });
}

/* ─────────────────────────────────────────────── */
/*  10. إشعار الأدمن عند رد العميل على العرض      */
/* ─────────────────────────────────────────────── */

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  accepted:                { label: "وافق على العرض",  color: "#09B14B" },
  rejected:                { label: "رفض العرض",       color: "#dc2626" },
  modification_requested:  { label: "طلب تعديل",       color: "#f59e0b" },
};

export async function sendClientResponseNotification(data: {
  project_name: string;
  client_name: string;
  action: string;
  reason?: string;
  quote_id: string;
}) {
  const actionInfo = ACTION_LABELS[data.action] ?? { label: data.action, color: "#6b7280" };
  const adminUrl = safeUrl(`${BASE_URL}/admin/quotes/${data.quote_id}`);

  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `رد العميل: ${actionInfo.label} — ${data.project_name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1D3F1F;">
        <div style="background: ${esc(actionInfo.color)}; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">رد العميل على العرض</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 120px;">المشروع:</td>
              <td style="padding: 8px 0; font-weight: bold;">${esc(data.project_name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">العميل:</td>
              <td style="padding: 8px 0;">${esc(data.client_name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">الرد:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${esc(actionInfo.color)}20; color: ${esc(actionInfo.color)}; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                  ${esc(actionInfo.label)}
                </span>
              </td>
            </tr>
            ${data.reason ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">السبب:</td>
              <td style="padding: 8px 0; color: #4b5563; line-height: 1.6;">${esc(data.reason)}</td>
            </tr>
            ` : ""}
          </table>
          <a href="${adminUrl}" style="display: inline-block; background: #1D3F1F; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
            عرض الطلب في لوحة التحكم
          </a>
        </div>
      </div>
    `,
  });
}
