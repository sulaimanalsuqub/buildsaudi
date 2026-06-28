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
const ERPNEXT_URL = process.env.ERPNEXT_URL?.replace(/\/$/, "");

const LOGO_URL   = `${BASE_URL}/brand/logo-en.svg`;
const LOGO_AR_URL = `${BASE_URL}/brand/logo-ar.svg`;

// إرسال الإيميل مع إعادة المحاولة تلقائياً (3 محاولات، backoff تصاعدي)
type EmailParams = Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0];
async function sendEmail(params: EmailParams) {
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await getResend().emails.send(params);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 600));
      }
    }
  }
  throw lastError;
}

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

// تحصين الروابط — يسمح فقط بـ https: و mailto:
function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["https:", "mailto:"].includes(parsed.protocol)) {
      return "#";
    }
    return url;
  } catch {
    return "#";
  }
}

function erpnextDocUrl(doctype: "opportunity" | "supplier", id: string): string {
  const fallbackPath = doctype === "opportunity" ? "/get-quote" : "/ar/register";
  const encodedId = encodeURIComponent(id);
  return safeUrl(
    ERPNEXT_URL ? `${ERPNEXT_URL}/app/${doctype}/${encodedId}` : `${BASE_URL}${fallbackPath}`
  );
}

// ─────────────────────────────────────────────
//  هيكل الإيميل الموحّد
// ─────────────────────────────────────────────
type EmailShellOptions = {
  previewText?: string;
  accentColor?: string;
  badgeIcon?: string;
  badgeLabel?: string;
  logoVariant?: "en" | "ar";
  content: string;
};

function emailShell({
  previewText = "",
  accentColor = "#1D3F1F",
  badgeIcon = "",
  badgeLabel = "",
  logoVariant = "en",
  content,
}: EmailShellOptions): string {
  const logoSrc = logoVariant === "ar" ? LOGO_AR_URL : LOGO_URL;
  const badge = badgeIcon || badgeLabel
    ? `<div style="display:inline-flex;align-items:center;gap:8px;background:${accentColor}1a;border:1px solid ${accentColor}33;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;color:${accentColor};margin-bottom:20px;">
        ${badgeIcon ? `<span style="font-size:15px;">${badgeIcon}</span>` : ""}
        ${badgeLabel ? `<span>${esc(badgeLabel)}</span>` : ""}
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>Build Saudi</title>
</head>
<body style="margin:0;padding:0;background:#f0f2ef;font-family:Tahoma,Arial,'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,sans-serif;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0f2ef;">${esc(previewText)}</div>` : ""}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0f2ef;padding:40px 16px 48px;">
  <tr><td align="center">

    <!-- Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

      <!-- Logo Header -->
      <tr>
        <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:28px 40px 24px;border-bottom:1px solid #e8ede8;text-align:right;">
          <img src="${logoSrc}" alt="Build Saudi" height="38" style="display:inline-block;height:38px;width:auto;vertical-align:middle;" />
        </td>
      </tr>

      <!-- Accent Bar -->
      <tr>
        <td style="background:${accentColor};height:4px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="background:#ffffff;padding:36px 40px 40px;border-radius:0 0 16px 16px;">
          ${badge}
          ${content}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:28px 16px 0;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="background:#1D3F1F;border-radius:12px;padding:24px 32px;">
                <img src="${LOGO_URL}" alt="Build Saudi" height="26" style="display:block;margin:0 auto 14px;height:26px;width:auto;opacity:.9;" />
                <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,.5);text-align:center;direction:rtl;">
                  منصة Build Saudi لتوريد مواد البناء في المملكة العربية السعودية
                </p>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,.3);text-align:center;">
                  © ${new Date().getFullYear()} Build Saudi · جميع الحقوق محفوظة
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`;
}

// ─────────────────────────────────────────────
//  مكوّنات مشتركة
// ─────────────────────────────────────────────
function infoRow(label: string, value: string, dir = "rtl") {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f2ef;color:#6b7280;font-size:13px;width:130px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f2ef;font-weight:600;color:#1D3F1F;font-size:14px;" dir="${dir}">${value}</td>
  </tr>`;
}

function infoTable(rows: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:28px;">${rows}</table>`;
}

function ctaButton(href: string, label: string, color = "#09B14B") {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
    <tr>
      <td style="border-radius:10px;background:${color};">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:.3px;">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

function greeting(name: string, subtitle?: string) {
  return `<h2 style="margin:0 0 ${subtitle ? "6px" : "20px"};font-size:22px;font-weight:700;color:#1D3F1F;line-height:1.3;">مرحباً، ${esc(name)}</h2>
${subtitle ? `<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${esc(subtitle)}</p>` : ""}`;
}

function highlightBox(content: string, color = "#09B14B") {
  return `<div style="background:${color}0d;border-right:4px solid ${color};border-radius:0 10px 10px 0;padding:16px 20px;margin:24px 0;font-size:14px;color:#1D3F1F;line-height:1.7;">${content}</div>`;
}

function sectionTitle(text: string) {
  return `<p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;">${esc(text)}</p>`;
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
  const opportunityUrl = erpnextDocUrl("opportunity", quote.id);

  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `طلب تسعير جديد — ${quote.project_name}`,
    html: emailShell({
      previewText: `طلب تسعير جديد من ${quote.client_name} لمشروع ${quote.project_name}`,
      accentColor: "#09B14B",
      badgeIcon: "📋",
      badgeLabel: "طلب تسعير جديد",
      content: `
        ${greeting(quote.client_name, `مشروع: ${quote.project_name}`)}
        ${sectionTitle("تفاصيل الطلب")}
        ${infoTable(
          infoRow("المشروع", esc(quote.project_name)) +
          infoRow("العميل", esc(quote.client_name)) +
          infoRow("الجوال", esc(quote.phone), "ltr") +
          infoRow("عنوان التسليم", esc(quote.delivery_address))
        )}
        ${sectionTitle("المواد المطلوبة")}
        <div style="background:#f8faf8;border:1px solid #e8ede8;border-radius:10px;padding:16px 20px;margin-bottom:8px;font-size:14px;color:#374151;line-height:1.8;">${esc(quote.materials)}</div>
        ${ctaButton(opportunityUrl, "فتح الطلب في لوحة التحكم")}
      `,
    }),
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
  return sendEmail({
    from: FROM,
    to: quote.client_email,
    subject: `تم استلام طلبك — ${quote.project_name}`,
    html: emailShell({
      previewText: `تم استلام طلبك لمشروع ${quote.project_name} بنجاح`,
      accentColor: "#09B14B",
      badgeIcon: "✅",
      badgeLabel: "تم استلام الطلب",
      content: `
        ${greeting(quote.client_name)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تم استلام طلب عرض السعر الخاص بمشروع <strong style="color:#1D3F1F;">${esc(quote.project_name)}</strong> بنجاح.
        </p>
        ${highlightBox(`سيتواصل معك فريق Build Saudi خلال <strong>24 ساعة</strong> بعرض سعر مفصّل يشمل جميع المواد المطلوبة.`)}
        ${sectionTitle("تفاصيل الطلب")}
        ${infoTable(infoRow("المشروع", esc(quote.project_name)))}
        <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.7;">للاستفسار، يمكنك التواصل معنا مباشرةً عبر الموقع أو البريد الإلكتروني.</p>
      `,
    }),
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

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: `طلب توقيع عقد — ${vendor.contractTitle}`,
    html: emailShell({
      previewText: `يرجى مراجعة عقد ${vendor.contractTitle} والتوقيع عليه`,
      accentColor: "#1D3F1F",
      badgeIcon: "📝",
      badgeLabel: "طلب توقيع عقد",
      content: `
        ${greeting(`${vendor.manager_name} / ${vendor.establishment_name}`)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          يرجى مراجعة عقد الشراكة مع Build Saudi والموافقة عليه.
        </p>
        ${sectionTitle("تفاصيل العقد")}
        ${infoTable(
          infoRow("اسم العقد", esc(vendor.contractTitle)) +
          infoRow("المنشأة", esc(vendor.establishment_name)) +
          infoRow("المسؤول", esc(vendor.manager_name))
        )}
        ${highlightBox("يُرجى مراجعة بنود العقد بعناية قبل التوقيع. الرابط صالح لمدة محدودة.", "#f59e0b")}
        ${ctaButton(signUrl, "مراجعة العقد والتوقيع")}
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">
          إذا لم يعمل الزر، انسخ هذا الرابط:<br/>
          <span dir="ltr" style="word-break:break-all;color:#6b7280;">${signUrl}</span>
        </p>
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  4. إشعار المورد — بدء رحلة التوريد (بعد موافقة الأدمن)
// ─────────────────────────────────────────────
export async function sendVendorJourneyStartedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  onboarding_url: string;
}) {
  const completeUrl = safeUrl(vendor.onboarding_url);
  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: "رحلة توريد منتجاتك بدأت — Build Saudi",
    html: emailShell({
      previewText: `تمت الموافقة على طلب انضمام ${vendor.establishment_name} — أكمل ملفك لبدء استقبال فرص التوريد`,
      accentColor: "#09B14B",
      badgeIcon: "🚀",
      badgeLabel: "رحلة التوريد بدأت",
      content: `
        ${greeting(`${vendor.manager_name} / ${vendor.establishment_name}`)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تمت <strong style="color:#09B14B;">الموافقة على طلب انضمامكم</strong> إلى شبكة موردي Build Saudi.
          الخطوة التالية: أكملوا ملف التوريد الخاص بمنشأتكم.
        </p>
        ${highlightBox("ستحتاجون للتحقق من بريدكم الإلكتروني برمز OTP ثم إكمال: فئات المنتجات، التغطية، البيانات المالية، والمستندات.")}
        ${sectionTitle("ما المطلوب؟")}
        <ul style="margin:0 0 24px;padding-right:20px;color:#4b5563;font-size:14px;line-height:2;">
          <li>فئات المنتجات ومناطق التغطية</li>
          <li>شروط الدفع والائتمان</li>
          <li>بيانات الحساب البنكي (IBAN)</li>
          <li>نسخة السجل التجاري وخطاب البنك</li>
        </ul>
        ${ctaButton(completeUrl, "إكمال ملف التوريد")}
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">
          الرابط صالح لمدة 14 يوماً. إذا لم يعمل الزر، انسخ الرابط:<br/>
          <span dir="ltr" style="word-break:break-all;color:#6b7280;">${completeUrl}</span>
        </p>
      `,
    }),
  });
}

/** @deprecated Use sendVendorJourneyStartedEmail after admin approval */
export async function sendVendorActivatedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
}) {
  const onboardingUrl = `${BASE_URL}/ar/register/complete`;
  return sendVendorJourneyStartedEmail({ ...vendor, onboarding_url: onboardingUrl });
}

// ─────────────────────────────────────────────
//  5. إشعار المورد — رفض الحساب
// ─────────────────────────────────────────────
export async function sendVendorRejectedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
}) {
  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: "بخصوص طلب الانضمام — Build Saudi",
    html: emailShell({
      previewText: `بخصوص طلب انضمام ${vendor.establishment_name} إلى Build Saudi`,
      accentColor: "#1D3F1F",
      badgeLabel: "بخصوص طلب الانضمام",
      content: `
        ${greeting(`${vendor.manager_name} / ${vendor.establishment_name}`)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          نشكركم على اهتمامكم بالانضمام إلى شبكة موردي Build Saudi واهتمامكم بالتعاون معنا.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          للأسف، لم نتمكن من قبول طلبكم في الوقت الحالي. يمكنكم التواصل معنا عبر البريد الإلكتروني للاستفسار عن أسباب القرار أو إعادة التقديم مستقبلاً.
        </p>
        <p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>
      `,
    }),
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
    .map((item, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8faf8"};">
        <td style="padding:10px 14px;font-size:13px;color:#1D3F1F;font-weight:500;">${esc(item.name)}</td>
        <td style="padding:10px 14px;text-align:center;font-size:13px;font-weight:700;color:#09B14B;">${esc(String(item.quantity))}</td>
        <td style="padding:10px 14px;font-size:13px;color:#6b7280;">${esc(item.unit)}</td>
        <td style="padding:10px 14px;font-size:12px;color:#9ca3af;">${esc(item.description ?? "") || "—"}</td>
      </tr>`)
    .join("");

  return sendEmail({
    from: FROM,
    to: params.vendorEmail,
    subject: `طلب عرض سعر — ${params.projectName}`,
    html: emailShell({
      previewText: `طلب عرض سعر لمشروع ${params.projectName} — الموعد النهائي: ${params.deadline}`,
      accentColor: "#1D3F1F",
      badgeIcon: "💼",
      badgeLabel: "طلب عرض سعر (RFQ)",
      content: `
        ${greeting(`${params.managerName} / ${params.vendorName}`)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          نرجو التكرم بتزويدنا بعرض سعر للمواد المذكورة أدناه لمشروع <strong style="color:#1D3F1F;">${esc(params.projectName)}</strong>.
        </p>

        ${sectionTitle("معلومات التسليم")}
        ${infoTable(
          infoRow("عنوان التسليم", esc(params.deliveryAddress)) +
          infoRow("تاريخ التسليم", esc(params.deliveryDate))
        )}

        ${sectionTitle("المواد المطلوبة")}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e8ede8;border-radius:10px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#1D3F1F;">
              <th style="padding:10px 14px;text-align:right;font-size:12px;color:rgba(255,255,255,.8);font-weight:600;">الصنف</th>
              <th style="padding:10px 14px;text-align:center;font-size:12px;color:rgba(255,255,255,.8);font-weight:600;">الكمية</th>
              <th style="padding:10px 14px;text-align:right;font-size:12px;color:rgba(255,255,255,.8);font-weight:600;">الوحدة</th>
              <th style="padding:10px 14px;text-align:right;font-size:12px;color:rgba(255,255,255,.8);font-weight:600;">الوصف</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        ${highlightBox(`⏰ الموعد النهائي للرد: <strong>${esc(params.deadline)}</strong>`, "#f59e0b")}

        ${params.notes ? `${sectionTitle("ملاحظات إضافية")}<p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.8;background:#f8faf8;border-radius:10px;padding:14px 18px;">${esc(params.notes)}</p>` : ""}

        <p style="margin:24px 0 0;font-size:14px;color:#374151;line-height:1.8;">
          يُرجى الرد على هذا البريد مباشرةً بعرض سعركم متضمنًا: السعر الإجمالي، مدة التوريد، وأي شروط خاصة.
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">رقم الطلب: <span dir="ltr">${esc(params.rfqId.split("-")[0])}</span></p>
      `,
    }),
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

  return sendEmail({
    from: FROM,
    to: offer.client_email,
    subject: `عرض سعر جاهز — ${offer.project_name}`,
    html: emailShell({
      previewText: `عرض السعر لمشروع ${offer.project_name} جاهز — الإجمالي: ${fmt(offer.grand_total)}`,
      accentColor: "#09B14B",
      badgeIcon: "✅",
      badgeLabel: "عرض السعر جاهز",
      content: `
        ${greeting(offer.client_name)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          يسعدنا إبلاغك بأن عرض السعر لمشروع <strong style="color:#1D3F1F;">${esc(offer.project_name)}</strong> جاهز الآن.
          يُرجى مراجعته والرد خلال <strong>${esc(String(offer.validity_days))} أيام</strong>.
        </p>

        ${sectionTitle("تفاصيل العرض المالي")}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8faf8;border:1px solid #e8ede8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <tr style="border-bottom:1px solid #e8ede8;">
            <td style="padding:14px 20px;font-size:14px;color:#4b5563;">قيمة المواد والتوريد</td>
            <td style="padding:14px 20px;text-align:left;font-size:14px;font-weight:600;color:#1D3F1F;" dir="ltr">${fmt(offer.materials_total)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8ede8;">
            <td style="padding:14px 20px;font-size:14px;color:#4b5563;">التوصيل والجمارك (DDP)</td>
            <td style="padding:14px 20px;text-align:left;font-size:14px;font-weight:600;color:#1D3F1F;" dir="ltr">${fmt(offer.freight_total)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8ede8;">
            <td style="padding:14px 20px;font-size:14px;color:#4b5563;">رسوم خدمة المنصة</td>
            <td style="padding:14px 20px;text-align:left;font-size:14px;font-weight:600;color:#1D3F1F;" dir="ltr">${fmt(offer.platform_fee)}</td>
          </tr>
          <tr style="background:#1D3F1F;">
            <td style="padding:16px 20px;font-size:16px;font-weight:700;color:#ffffff;">الإجمالي DDP</td>
            <td style="padding:16px 20px;text-align:left;font-size:20px;font-weight:800;color:#09B14B;" dir="ltr">${fmt(offer.grand_total)}</td>
          </tr>
        </table>

        ${sectionTitle("تفاصيل التسليم")}
        ${infoTable(
          infoRow("عنوان التسليم", esc(offer.delivery_address)) +
          infoRow("تاريخ التسليم", esc(offer.delivery_date))
        )}

        ${ctaButton(offerUrl, "مراجعة العرض والرد عليه")}
        <p style="margin:14px 0 0;text-align:center;font-size:12px;color:#9ca3af;">
          صالح لمدة ${esc(String(offer.validity_days))} أيام — ينتهي تلقائيًا بعد انتهاء المدة
        </p>
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  8. إشعار العميل — تحديث حالة الطلب
// ─────────────────────────────────────────────
const STATUS_CLIENT_MAP: Record<string, { subject: string; title: string; message: string; color: string; icon: string }> = {
  admin_approved: {
    subject: "طلبك تحت المعالجة",
    title: "طلبك قيد المعالجة",
    message: "تم مراجعة طلبك والموافقة عليه. نعمل الآن على تجهيز عروض الأسعار من الموردين المعتمدين وسنوافيك بالعرض النهائي في أقرب وقت.",
    color: "#09B14B",
    icon: "⚙️",
  },
  payment_pending: {
    subject: "بانتظار تأكيد الدفع",
    title: "بانتظار الدفع",
    message: "شكرًا لموافقتك على العرض. يُرجى إتمام عملية الدفع حتى نتمكن من البدء بتجهيز طلبك.",
    color: "#f59e0b",
    icon: "💳",
  },
  payment_confirmed: {
    subject: "تم تأكيد الدفع",
    title: "تم تأكيد الدفع",
    message: "تم استلام وتأكيد الدفع بنجاح. سنبدأ بتجهيز طلبك وشحنه في أقرب وقت.",
    color: "#09B14B",
    icon: "✅",
  },
  in_delivery: {
    subject: "طلبك في الطريق",
    title: "طلبك في الطريق إليك",
    message: "تم شحن طلبك وهو في الطريق إلى موقع التسليم. سنوافيك بالتفاصيل عند الوصول.",
    color: "#3b82f6",
    icon: "🚚",
  },
  done: {
    subject: "تم تسليم طلبك بنجاح",
    title: "تم التسليم بنجاح",
    message: "تم تسليم طلبك بنجاح إلى الموقع المحدد. شكرًا لثقتك في Build Saudi ونتطلع للتعاون معك مجددًا.",
    color: "#09B14B",
    icon: "🎉",
  },
  cancelled: {
    subject: "تم إلغاء الطلب",
    title: "تم إلغاء الطلب",
    message: "نود إبلاغك بأنه تم إلغاء طلبك. إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.",
    color: "#ef4444",
    icon: "❌",
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

  return sendEmail({
    from: FROM,
    to: params.client_email,
    subject: `${config.subject} — ${params.project_name}`,
    html: emailShell({
      previewText: `${config.subject} — مشروع ${params.project_name}`,
      accentColor: config.color,
      badgeIcon: config.icon,
      badgeLabel: config.title,
      content: `
        ${greeting(params.client_name)}
        ${highlightBox(config.message, config.color)}
        ${sectionTitle("تفاصيل المشروع")}
        ${infoTable(infoRow("المشروع", esc(params.project_name)))}
        <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.7;">للاستفسار، يمكنك التواصل معنا مباشرةً.</p>
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  9. إشعار الأدمن — تسجيل مورد جديد
// ─────────────────────────────────────────────
export async function sendNewVendorRegistrationNotification(vendor: {
  id: string;
  establishment_name: string;
  manager_name: string;
  contact_number: string;
  email: string;
  cr_number: string;
  vendor_type: string;
  product_categories: string[];
  coverage_regions: string[];
}) {
  const supplierUrl = erpnextDocUrl("supplier", vendor.id);

  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `مورد جديد — ${vendor.establishment_name}`,
    html: emailShell({
      previewText: `تسجيل مورد جديد: ${vendor.establishment_name}`,
      accentColor: "#1D3F1F",
      badgeIcon: "🏗️",
      badgeLabel: "مورد جديد من الموقع",
      content: `
        ${greeting(vendor.establishment_name, "طلب انضمام جديد من build.sa")}
        ${sectionTitle("بيانات المنشأة")}
        ${infoTable(
          infoRow("المنشأة", esc(vendor.establishment_name)) +
          infoRow("المسؤول", esc(vendor.manager_name)) +
          infoRow("الجوال", esc(vendor.contact_number), "ltr") +
          infoRow("البريد", esc(vendor.email), "ltr") +
          infoRow("السجل التجاري", esc(vendor.cr_number), "ltr") +
          infoRow("نوع النشاط", esc(vendor.vendor_type))
        )}
        ${sectionTitle("التخصص والتغطية")}
        ${infoTable(
          infoRow("الفئات", esc(vendor.product_categories.join("، "))) +
          infoRow("المناطق", esc(vendor.coverage_regions.join("، ")))
        )}
        ${highlightBox("الخطوة التالية: افتح المورد في ERPNext → <strong>Review</strong> → راجع البيانات → <strong>Approve</strong> أو <strong>Reject</strong>.")}
        ${ctaButton(supplierUrl, "مراجعة المورد في ERPNext")}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  10. تأكيد تسجيل المورد
// ─────────────────────────────────────────────
export async function sendVendorRegistrationConfirmation(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
}) {
  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: "تم استلام طلب انضمامكم — Build Saudi",
    html: emailShell({
      previewText: `تم استلام طلب انضمام ${vendor.establishment_name} إلى شبكة موردي Build Saudi`,
      accentColor: "#09B14B",
      badgeIcon: "📬",
      badgeLabel: "تم استلام طلب الانضمام",
      content: `
        ${greeting(`${vendor.manager_name} / ${vendor.establishment_name}`)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          شكرًا لاهتمامكم بالانضمام إلى شبكة موردي Build Saudi. تم استلام بياناتكم الأساسية وسيراجعها فريقنا.
        </p>
        ${highlightBox("بعد الموافقة الأولية، يصلكم رابط لإكمال ملف التوريد (الفئات، البنك، والمستندات). الاعتماد النهائي بعد مراجعة الملف الكامل.")}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>
      `,
    }),
  });
}

export async function sendVendorProfileSubmittedNotification(vendor: {
  id: string;
  establishment_name: string;
  email: string;
}) {
  const supplierUrl = erpnextDocUrl("supplier", vendor.id);
  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `ملف توريد مكتمل — ${vendor.establishment_name}`,
    html: emailShell({
      previewText: `المورد ${vendor.establishment_name} أكمل ملف التوريد — مراجعة نهائية مطلوبة`,
      accentColor: "#1D3F1F",
      badgeIcon: "📋",
      badgeLabel: "ملف توريد جاهز للمراجعة",
      content: `
        ${greeting("فريق Build", "ملف توريد مكتمل")}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          أكمل المورد <strong>${esc(vendor.establishment_name)}</strong> ملف التوريد من الموقع.
          راجع الفئات والبنك والمستندات ثم اعتمد نهائياً من ERPNext.
        </p>
        ${infoTable(
          infoRow("المنشأة", esc(vendor.establishment_name)) +
            infoRow("البريد", esc(vendor.email), "ltr")
        )}
        ${ctaButton(supplierUrl, "مراجعة المورد في ERPNext")}
      `,
    }),
  });
}

/* ─────────────────────────────────────────────── */
/*  10. إشعار الأدمن عند رد العميل على العرض      */
/* ─────────────────────────────────────────────── */

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  accepted:               { label: "وافق على العرض", color: "#09B14B", icon: "✅" },
  rejected:               { label: "رفض العرض",      color: "#dc2626", icon: "❌" },
  modification_requested: { label: "طلب تعديل",      color: "#f59e0b", icon: "✏️" },
};

// ─────────────────────────────────────────────
//  OTP — التحقق من البريد الإلكتروني
// ─────────────────────────────────────────────
export async function sendEmailVerificationOTP(params: { email: string; code: string }) {
  return sendEmail({
    from: FROM,
    to: params.email,
    subject: "رمز التحقق — Build Saudi",
    html: emailShell({
      previewText: `رمز التحقق الخاص بك: ${params.code}`,
      accentColor: "#09B14B",
      badgeIcon: "🔐",
      badgeLabel: "التحقق من البريد الإلكتروني",
      content: `
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1D3F1F;">رمز التحقق</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          أدخل الرمز أدناه لإكمال التحقق من بريدك الإلكتروني على منصة Build Saudi.
        </p>
        <div style="background:#f0f9f3;border:2px solid #09B14B33;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;letter-spacing:.5px;">رمز التحقق</p>
          <p style="margin:0;font-size:40px;font-weight:800;color:#1D3F1F;letter-spacing:10px;font-variant-numeric:tabular-nums;" dir="ltr">${esc(params.code)}</p>
        </div>
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.7;">
          هذا الرمز صالح لمدة <strong>5 دقائق</strong>. لا تشاركه مع أي شخص.
        </p>
      `,
    }),
  });
}

export async function sendClientResponseNotification(data: {
  project_name: string;
  client_name: string;
  action: string;
  reason?: string;
  quote_id: string;
}) {
  const actionInfo = ACTION_LABELS[data.action] ?? { label: data.action, color: "#6b7280", icon: "💬" };
  const adminUrl = erpnextDocUrl("opportunity", data.quote_id);

  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `رد العميل: ${actionInfo.label} — ${data.project_name}`,
    html: emailShell({
      previewText: `${data.client_name} ${actionInfo.label} على عرض مشروع ${data.project_name}`,
      accentColor: actionInfo.color,
      badgeIcon: actionInfo.icon,
      badgeLabel: `رد العميل: ${actionInfo.label}`,
      content: `
        ${greeting(data.client_name, `مشروع: ${data.project_name}`)}
        ${sectionTitle("تفاصيل الرد")}
        ${infoTable(
          infoRow("المشروع", esc(data.project_name)) +
          infoRow("العميل", esc(data.client_name)) +
          infoRow("القرار", `<span style="background:${actionInfo.color}1a;color:${actionInfo.color};padding:3px 12px;border-radius:999px;font-weight:700;font-size:13px;">${esc(actionInfo.icon)} ${esc(actionInfo.label)}</span>`)
        )}
        ${data.reason ? `${sectionTitle("سبب القرار")}
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.8;background:#f8faf8;border-radius:10px;padding:14px 18px;">${esc(data.reason)}</p>` : ""}
        ${ctaButton(adminUrl, "فتح الطلب في لوحة التحكم")}
      `,
    }),
  });
}
