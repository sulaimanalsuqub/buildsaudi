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

const ODOO_BASE_URL = process.env.ODOO_BASE_URL?.replace(/\/$/, "");

/** رابط سجل Odoo لفريق العمل الداخلي — Classic Web Client hash URL (يعمل عبر إصدارات Odoo المختلفة) */
function odooRecordUrl(model: string, id: number): string {
  return safeUrl(
    ODOO_BASE_URL ? `${ODOO_BASE_URL}/web#model=${model}&view_type=form&id=${id}` : `${BASE_URL}/ar/register`
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
  lang?: "ar" | "en";
  content: string;
};

function emailShell({
  previewText = "",
  accentColor = "#1D3F1F",
  badgeIcon = "",
  badgeLabel = "",
  logoVariant,
  lang = "ar",
  content,
}: EmailShellOptions): string {
  const isEn = lang === "en";
  const logoSrc = (logoVariant ?? (isEn ? "en" : "ar")) === "ar" ? LOGO_AR_URL : LOGO_URL;
  const htmlLang = isEn ? "en" : "ar";
  const htmlDir = isEn ? "ltr" : "rtl";
  const textAlign = isEn ? "left" : "right";
  const badge = badgeIcon || badgeLabel
    ? `<div style="display:inline-flex;align-items:center;gap:8px;background:${accentColor}1a;border:1px solid ${accentColor}33;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;color:${accentColor};margin-bottom:20px;">
        ${badgeIcon ? `<span style="font-size:15px;">${badgeIcon}</span>` : ""}
        ${badgeLabel ? `<span>${esc(badgeLabel)}</span>` : ""}
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${htmlDir}">
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
        <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:28px 40px 24px;border-bottom:1px solid #e8ede8;text-align:${textAlign};">
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
                <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,.5);text-align:center;direction:${htmlDir};">
                  ${isEn ? "Build — construction &amp; finishing materials supplier for projects in Saudi Arabia" : "بيلد — مورد مواد بناء وتشطيب للمشاريع الإنشائية في السعودية"}
                </p>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,.3);text-align:center;">
                  © ${new Date().getFullYear()} Build Saudi · ${isEn ? "All rights reserved" : "جميع الحقوق محفوظة"}
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
//  4. إشعار المورد — بدء رحلة التوريد (بعد موافقة الأدمن)
// ─────────────────────────────────────────────
export async function sendVendorJourneyStartedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  onboarding_url: string;
  lang?: "ar" | "en";
}) {
  const completeUrl = safeUrl(vendor.onboarding_url);
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Your supplier journey has started — Build Saudi" : "رحلة توريد منتجاتك بدأت — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${vendor.establishment_name}'s application was approved — complete your profile to start receiving supply opportunities`
        : `تمت الموافقة على طلب انضمام ${vendor.establishment_name} — أكمل ملفك لبدء استقبال فرص التوريد`,
      accentColor: "#09B14B",
      badgeIcon: "🚀",
      badgeLabel: isEn ? "Supplier journey started" : "رحلة التوريد بدأت",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Your application to join the Build Saudi supplier network has been <strong style="color:#09B14B;">approved</strong>.
          Next step: complete your establishment's supply profile.
        </p>
        ${highlightBox("You'll verify your email with an OTP code, then complete: product categories, coverage, financial details, and documents.")}
        ${sectionTitle("What's required?")}
        <ul style="margin:0 0 24px;padding-left:20px;color:#4b5563;font-size:14px;line-height:2;">
          <li>Product categories and coverage areas</li>
          <li>Payment and credit terms</li>
          <li>Bank account details (IBAN)</li>
          <li>Commercial registration copy and bank letter</li>
        </ul>
        ${ctaButton(completeUrl, "Complete supplier profile")}
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">
          This link is valid for 14 days. If the button doesn't work, copy this link:<br/>
          <span dir="ltr" style="word-break:break-all;color:#6b7280;">${completeUrl}</span>
        </p>
      `
        : `
        ${greeting(fullName)}
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

/**
 * اعتماد نهائي بعد إكمال الملف — المورد جاهز لاستقبال RFQ.
 * لا ترسل رابط إكمال (الملف مكتمل مسبقاً).
 */
export async function sendVendorFullyApprovedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Your supplier account is now active — Build Saudi" : "تم تفعيل حسابك كمورد — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${vendor.establishment_name} is now an approved supplier on Build Saudi`
        : `أصبحت ${vendor.establishment_name} مورداً معتمداً في Build Saudi`,
      accentColor: "#09B14B",
      badgeIcon: "✅",
      badgeLabel: isEn ? "Approved supplier" : "مورد معتمد",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Your profile has been reviewed and <strong style="color:#1D3F1F;">${esc(vendor.establishment_name)}</strong>
          is now <strong style="color:#09B14B;">fully approved</strong> as a supplier on Build Saudi.
        </p>
        ${highlightBox("You're now eligible to receive Request for Quotation (RFQ) emails whenever a matching opportunity comes up.")}
        <ul style="margin:0 0 24px;padding-left:20px;color:#4b5563;font-size:14px;line-height:2;">
          <li>RFQs will arrive at this email address</li>
          <li>Please reply with pricing, lead time, and terms</li>
          <li>No further action is needed on the site right now</li>
        </ul>
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تمت مراجعة ملفكم واعتماد منشأة <strong style="color:#1D3F1F;">${esc(vendor.establishment_name)}</strong>
          كمورد <strong style="color:#09B14B;">معتمد نهائياً</strong> في Build Saudi.
        </p>
        ${highlightBox("أنتم الآن مؤهلون لاستقبال طلبات عروض الأسعار (RFQ) عبر البريد عند توفر فرص مناسبة لتخصصاتكم.")}
        <ul style="margin:0 0 24px;padding-right:20px;color:#4b5563;font-size:14px;line-height:2;">
          <li>ستصلكم طلبات RFQ على هذا البريد</li>
          <li>يُرجى الرد بالأسعار ومدة التوريد والشروط</li>
          <li>لا حاجة لأي خطوة إضافية على الموقع الآن</li>
        </ul>
        ${signOff}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  5. إشعار المورد — رفض الحساب
// ─────────────────────────────────────────────
export async function sendVendorRejectedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  reason?: string;
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;
  const reasonText = vendor.reason?.trim();
  const reasonBlock = reasonText
    ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;"><strong style="color:#1D3F1F;">${isEn ? "Reason:" : "السبب:"}</strong> ${esc(reasonText)}</p>`
    : "";
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Regarding your application — Build Saudi" : "بخصوص طلب الانضمام — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `Regarding ${vendor.establishment_name}'s application to Build Saudi`
        : `بخصوص طلب انضمام ${vendor.establishment_name} إلى Build Saudi`,
      accentColor: "#1D3F1F",
      badgeLabel: isEn ? "Regarding your application" : "بخصوص طلب الانضمام",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Thank you for your interest in joining the Build Saudi supplier network.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Unfortunately, we're unable to accept your application at this time. You may reach out to us by email with any questions, or re-apply in the future.
        </p>
        ${reasonBlock}
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          نشكركم على اهتمامكم بالانضمام إلى شبكة موردي Build Saudi واهتمامكم بالتعاون معنا.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          للأسف، لم نتمكن من قبول طلبكم في الوقت الحالي. يمكنكم التواصل معنا عبر البريد الإلكتروني للاستفسار أو إعادة التقديم مستقبلاً.
        </p>
        ${reasonBlock}
        ${signOff}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  5b. طلب توضيح (أولي أو نهائي) من المورد — Outbox
// ─────────────────────────────────────────────
export async function sendVendorMoreInfoRequestedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  requestedInfo?: string;
  /** رابط استكمال — يُرسل فقط عند مرحلة نهائية (المورد لديه ملف يعدّله) */
  onboardingUrl?: string;
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;
  const requested = vendor.requestedInfo?.trim();
  const requestedBlock = requested
    ? highlightBox(esc(requested), "#f59e0b")
    : "";
  const completeUrl = vendor.onboardingUrl ? safeUrl(vendor.onboardingUrl) : "";
  const signOff = isEn
    ? `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Additional information needed — Build Saudi" : "مطلوب توضيح إضافي — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `We need a bit more information to continue reviewing ${vendor.establishment_name}'s application`
        : `نحتاج بعض التوضيحات الإضافية لمواصلة مراجعة طلب ${vendor.establishment_name}`,
      accentColor: "#f59e0b",
      badgeIcon: "✏️",
      badgeLabel: isEn ? "Additional information needed" : "مطلوب توضيح إضافي",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          We're reviewing your application and need a bit more information before we can continue.
        </p>
        ${requestedBlock}
        ${completeUrl ? ctaButton(completeUrl, "Update your profile") : ""}
        ${completeUrl ? `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">If the button doesn't work, copy this link:<br/><span dir="ltr" style="word-break:break-all;color:#6b7280;">${completeUrl}</span></p>` : ""}
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          نراجع طلبكم حالياً ونحتاج بعض التوضيحات الإضافية قبل أن نتمكن من المتابعة.
        </p>
        ${requestedBlock}
        ${completeUrl ? ctaButton(completeUrl, "تحديث الملف") : ""}
        ${completeUrl ? `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">إذا لم يعمل الزر، انسخ الرابط:<br/><span dir="ltr" style="word-break:break-all;color:#6b7280;">${completeUrl}</span></p>` : ""}
        ${signOff}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  5c. إيقاف / إعادة تفعيل المورد — Outbox
// ─────────────────────────────────────────────
export async function sendVendorSuspendedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  reason?: string;
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;
  const reasonText = vendor.reason?.trim();
  const reasonBlock = reasonText
    ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;"><strong style="color:#1D3F1F;">${isEn ? "Reason:" : "السبب:"}</strong> ${esc(reasonText)}</p>`
    : "";
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Your supplier account has been suspended — Build Saudi" : "تم إيقاف حسابك كمورد — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${vendor.establishment_name}'s supplier account has been temporarily suspended`
        : `تم إيقاف حساب ${vendor.establishment_name} كمورد مؤقتاً`,
      accentColor: "#ef4444",
      badgeIcon: "⏸️",
      badgeLabel: isEn ? "Account suspended" : "الحساب موقوف",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Your supplier account with Build Saudi has been temporarily suspended and you will not receive new RFQs during this period.
        </p>
        ${reasonBlock}
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.8;">Please contact us by email if you have any questions.</p>
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تم إيقاف حسابكم كمورد لدى Build Saudi مؤقتاً، ولن تصلكم طلبات عروض أسعار جديدة خلال هذه الفترة.
        </p>
        ${reasonBlock}
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.8;">للاستفسار، يمكنكم التواصل معنا عبر البريد الإلكتروني.</p>
        ${signOff}
      `,
    }),
  });
}

export async function sendVendorReactivatedEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Your supplier account is active again — Build Saudi" : "تمت إعادة تفعيل حسابك كمورد — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${vendor.establishment_name}'s supplier account is active again`
        : `تمت إعادة تفعيل حساب ${vendor.establishment_name} كمورد`,
      accentColor: "#09B14B",
      badgeIcon: "✅",
      badgeLabel: isEn ? "Account reactivated" : "تمت إعادة التفعيل",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Your supplier account with Build Saudi is active again. You're now eligible to receive RFQs as before.
        </p>
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تمت إعادة تفعيل حسابكم كمورد لدى Build Saudi، وأصبحتم مؤهلين لاستقبال طلبات عروض الأسعار كما كان سابقاً.
        </p>
        ${signOff}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  5d. إشعار الأدمن — ملف مورد جاهز للمراجعة النهائية (Odoo)
// ─────────────────────────────────────────────
export async function sendSupplierFinalReviewNotification(vendor: {
  profileId: number;
  establishment_name: string;
  email: string;
}) {
  const profileUrl = odooRecordUrl("x_build_supplier_profile", vendor.profileId);
  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `ملف توريد جاهز للمراجعة النهائية — ${vendor.establishment_name}`,
    html: emailShell({
      previewText: `المورد ${vendor.establishment_name} أكمل ملف التوريد — مراجعة نهائية مطلوبة`,
      accentColor: "#1D3F1F",
      badgeIcon: "📋",
      badgeLabel: "ملف توريد جاهز للمراجعة",
      content: `
        ${greeting("فريق Build", "ملف توريد مكتمل")}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          أكمل المورد <strong>${esc(vendor.establishment_name)}</strong> ملف التوريد من الموقع.
          راجع الفئات والبنك والمستندات ثم اعتمد نهائياً من Odoo.
        </p>
        ${infoTable(
          infoRow("المنشأة", esc(vendor.establishment_name)) +
            infoRow("البريد", esc(vendor.email), "ltr")
        )}
        ${ctaButton(profileUrl, "مراجعة المورد في Odoo")}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  قوالب رحلة الناقل (Carrier) — نصوص مستقلة تماماً عن قوالب المورد
// ─────────────────────────────────────────────

export async function sendCarrierRegistrationConfirmation(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Your carrier application has been received — Build Saudi" : "تم استلام طلب انضمامكم كناقل — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${carrier.establishment_name}'s carrier application has been received`
        : `تم استلام طلب انضمام ${carrier.establishment_name} كناقل`,
      accentColor: "#09B14B",
      badgeIcon: "🚚",
      badgeLabel: isEn ? "Carrier application received" : "تم استلام طلب الانضمام كناقل",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Thank you for your interest in joining the Build Saudi carrier network. We've received your basic information and our logistics team will review it.
        </p>
        ${highlightBox("After preliminary approval, you'll receive a link to complete your carrier profile (service areas, vehicle types, licenses, insurance, and banking).")}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          شكرًا لاهتمامكم بالانضمام إلى شبكة ناقلي Build Saudi. تم استلام بياناتكم الأساسية وسيراجعها فريق العمليات اللوجستية.
        </p>
        ${highlightBox("بعد الموافقة الأولية، يصلكم رابط لإكمال ملف الناقل (مناطق الخدمة، أنواع المركبات، التراخيص، التأمين، والبيانات البنكية).")}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>
      `,
    }),
  });
}

export async function sendCarrierJourneyStartedEmail(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  onboarding_url: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  const completeUrl = safeUrl(carrier.onboarding_url);
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Your carrier onboarding has started — Build Saudi" : "استكمال ملف الناقل بدأ — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${carrier.establishment_name}'s carrier application was approved — complete your profile`
        : `تمت الموافقة على طلب انضمام ${carrier.establishment_name} كناقل — أكملوا ملفكم`,
      accentColor: "#09B14B",
      badgeIcon: "🚀",
      badgeLabel: isEn ? "Carrier onboarding started" : "استكمال ملف الناقل بدأ",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Your application to join the Build Saudi carrier network has been <strong style="color:#09B14B;">approved</strong>.
          Next step: complete your fleet and coverage profile.
        </p>
        ${highlightBox("You'll need to provide: service areas, vehicle types, accepted material types, transport license, insurance, and banking details.")}
        ${ctaButton(completeUrl, "Complete carrier profile")}
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">This link is valid for 14 days. If the button doesn't work, copy this link:<br/><span dir="ltr" style="word-break:break-all;color:#6b7280;">${completeUrl}</span></p>
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تمت <strong style="color:#09B14B;">الموافقة على طلب انضمامكم</strong> إلى شبكة ناقلي Build Saudi.
          الخطوة التالية: أكملوا ملف الأسطول والتغطية الخاص بكم.
        </p>
        ${highlightBox("ستحتاجون لتوفير: مناطق الخدمة، أنواع المركبات، أنواع المواد المقبولة، ترخيص النقل، التأمين، والبيانات البنكية.")}
        ${ctaButton(completeUrl, "إكمال ملف الناقل")}
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.7;">الرابط صالح لمدة 14 يوماً. إذا لم يعمل الزر، انسخ الرابط:<br/><span dir="ltr" style="word-break:break-all;color:#6b7280;">${completeUrl}</span></p>
      `,
    }),
  });
}

export async function sendCarrierMoreInfoRequestedEmail(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  requestedInfo?: string;
  onboardingUrl?: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  const requested = carrier.requestedInfo?.trim();
  const requestedBlock = requested ? highlightBox(esc(requested), "#f59e0b") : "";
  const completeUrl = carrier.onboardingUrl ? safeUrl(carrier.onboardingUrl) : "";
  const signOff = isEn
    ? `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Additional carrier information needed — Build Saudi" : "مطلوب توضيح إضافي لملف الناقل — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `We need a bit more information to continue reviewing ${carrier.establishment_name}'s carrier application`
        : `نحتاج بعض التوضيحات الإضافية لمواصلة مراجعة طلب الناقل ${carrier.establishment_name}`,
      accentColor: "#f59e0b",
      badgeIcon: "✏️",
      badgeLabel: isEn ? "Additional information needed" : "مطلوب توضيح إضافي",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">We're reviewing your carrier application and need a bit more information before we can continue.</p>
        ${requestedBlock}
        ${completeUrl ? ctaButton(completeUrl, "Update your carrier profile") : ""}
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">نراجع طلب انضمامكم كناقل ونحتاج بعض التوضيحات الإضافية قبل أن نتمكن من المتابعة.</p>
        ${requestedBlock}
        ${completeUrl ? ctaButton(completeUrl, "تحديث ملف الناقل") : ""}
        ${signOff}
      `,
    }),
  });
}

export async function sendCarrierRejectedEmail(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  reason?: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  const reasonText = carrier.reason?.trim();
  const reasonBlock = reasonText
    ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;"><strong style="color:#1D3F1F;">${isEn ? "Reason:" : "السبب:"}</strong> ${esc(reasonText)}</p>`
    : "";
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Regarding your carrier application — Build Saudi" : "بخصوص طلب الانضمام كناقل — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `Regarding ${carrier.establishment_name}'s carrier application to Build Saudi`
        : `بخصوص طلب انضمام ${carrier.establishment_name} كناقل إلى Build Saudi`,
      accentColor: "#1D3F1F",
      badgeLabel: isEn ? "Regarding your application" : "بخصوص طلب الانضمام",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">Thank you for your interest in joining the Build Saudi carrier network.</p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">Unfortunately, we're unable to accept your carrier application at this time. You may reach out to us by email with any questions, or re-apply in the future.</p>
        ${reasonBlock}
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">نشكركم على اهتمامكم بالانضمام إلى شبكة ناقلي Build Saudi.</p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">للأسف، لم نتمكن من قبول طلبكم كناقل في الوقت الحالي. يمكنكم التواصل معنا عبر البريد الإلكتروني للاستفسار أو إعادة التقديم مستقبلاً.</p>
        ${reasonBlock}
        ${signOff}
      `,
    }),
  });
}

export async function sendCarrierFullyApprovedEmail(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Your carrier account is now active — Build Saudi" : "تم تفعيل حسابك كناقل — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${carrier.establishment_name} is now an approved carrier on Build Saudi`
        : `أصبحت ${carrier.establishment_name} ناقلاً معتمداً في Build Saudi`,
      accentColor: "#09B14B",
      badgeIcon: "✅",
      badgeLabel: isEn ? "Approved carrier" : "ناقل معتمد",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Your profile has been reviewed and <strong style="color:#1D3F1F;">${esc(carrier.establishment_name)}</strong>
          is now <strong style="color:#09B14B;">fully approved</strong> as a carrier on Build Saudi.
        </p>
        ${highlightBox("You're now eligible to receive shipment and trip requests matching your coverage and fleet whenever one comes up.")}
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          تمت مراجعة ملفكم واعتماد <strong style="color:#1D3F1F;">${esc(carrier.establishment_name)}</strong>
          كناقل <strong style="color:#09B14B;">معتمد نهائياً</strong> في Build Saudi.
        </p>
        ${highlightBox("أنتم الآن مؤهلون لاستقبال طلبات الشحن والرحلات المطابقة لتغطيتكم وأسطولكم عند توفرها.")}
        ${signOff}
      `,
    }),
  });
}

export async function sendCarrierSuspendedEmail(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  reason?: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  const reasonText = carrier.reason?.trim();
  const reasonBlock = reasonText
    ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;"><strong style="color:#1D3F1F;">${isEn ? "Reason:" : "السبب:"}</strong> ${esc(reasonText)}</p>`
    : "";
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Your carrier account has been suspended — Build Saudi" : "تم إيقاف حسابك كناقل — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${carrier.establishment_name}'s carrier account has been temporarily suspended`
        : `تم إيقاف حساب ${carrier.establishment_name} كناقل مؤقتاً`,
      accentColor: "#ef4444",
      badgeIcon: "⏸️",
      badgeLabel: isEn ? "Account suspended" : "الحساب موقوف",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">Your carrier account with Build Saudi has been temporarily suspended and you will not receive new shipment requests during this period.</p>
        ${reasonBlock}
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.8;">Please contact us by email if you have any questions.</p>
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">تم إيقاف حسابكم كناقل لدى Build Saudi مؤقتاً، ولن تصلكم طلبات شحن جديدة خلال هذه الفترة.</p>
        ${reasonBlock}
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.8;">للاستفسار، يمكنكم التواصل معنا عبر البريد الإلكتروني.</p>
        ${signOff}
      `,
    }),
  });
}

export async function sendCarrierReactivatedEmail(carrier: {
  establishment_name: string;
  manager_name: string;
  email: string;
  lang?: "ar" | "en";
}) {
  const lang = carrier.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${carrier.manager_name} / ${carrier.establishment_name}`;
  const signOff = isEn
    ? `<p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;
  return sendEmail({
    from: FROM,
    to: carrier.email,
    subject: isEn ? "Your carrier account is active again — Build Saudi" : "تمت إعادة تفعيل حسابك كناقل — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${carrier.establishment_name}'s carrier account is active again`
        : `تمت إعادة تفعيل حساب ${carrier.establishment_name} كناقل`,
      accentColor: "#09B14B",
      badgeIcon: "✅",
      badgeLabel: isEn ? "Account reactivated" : "تمت إعادة التفعيل",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">Your carrier account with Build Saudi is active again. You're now eligible to receive shipment requests as before.</p>
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">تمت إعادة تفعيل حسابكم كناقل لدى Build Saudi، وأصبحتم مؤهلين لاستقبال طلبات الشحن كما كان سابقاً.</p>
        ${signOff}
      `,
    }),
  });
}

export async function sendCarrierFinalReviewNotification(carrier: {
  profileId: number;
  establishment_name: string;
  email: string;
}) {
  const profileUrl = odooRecordUrl("x_build_carrier_profile", carrier.profileId);
  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `ملف ناقل جاهز للمراجعة النهائية — ${carrier.establishment_name}`,
    html: emailShell({
      previewText: `الناقل ${carrier.establishment_name} أكمل ملفه — مراجعة نهائية مطلوبة`,
      accentColor: "#1D3F1F",
      badgeIcon: "🚚",
      badgeLabel: "ملف ناقل جاهز للمراجعة",
      content: `
        ${greeting("فريق Build", "ملف ناقل مكتمل")}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          أكمل الناقل <strong>${esc(carrier.establishment_name)}</strong> ملفه من الموقع.
          راجع نطاق الخدمة، التراخيص، التأمين، والمستندات ثم اعتمد نهائياً من Odoo.
        </p>
        ${infoTable(
          infoRow("المنشأة", esc(carrier.establishment_name)) +
            infoRow("البريد", esc(carrier.email), "ltr")
        )}
        ${ctaButton(profileUrl, "مراجعة الناقل في Odoo")}
      `,
    }),
  });
}

// ─────────────────────────────────────────────
//  5e. تنبيه انتهاء صلاحية مستند — Outbox/Cron
// ─────────────────────────────────────────────
const DOCUMENT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  cr_certificate: { ar: "السجل التجاري", en: "Commercial Registration" },
  vat_certificate: { ar: "شهادة ضريبة القيمة المضافة", en: "VAT Certificate" },
  bank_letter: { ar: "الخطاب البنكي", en: "Bank Letter" },
  national_address: { ar: "العنوان الوطني", en: "National Address" },
  registration_certificate: { ar: "شهادة التسجيل", en: "Registration Certificate" },
  license: { ar: "ترخيص النقل", en: "Transport License" },
  insurance: { ar: "وثيقة التأمين", en: "Insurance Policy" },
  vehicle_registration: { ar: "استمارة المركبة", en: "Vehicle Registration" },
  other: { ar: "مستند", en: "Document" },
};

export async function sendDocumentExpiryAlertEmail(vendor: {
  establishment_name: string;
  manager_name: string;
  email: string;
  documentType: string;
  expiryDate: string;
  daysLeft: number;
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;
  const docLabel = DOCUMENT_TYPE_LABELS[vendor.documentType]?.[lang] ?? vendor.documentType;
  const isExpired = vendor.daysLeft <= 0;
  const signOff = isEn
    ? `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>`
    : `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>`;

  const statusLine = isEn
    ? isExpired
      ? `<strong style="color:#ef4444;">has expired</strong>`
      : `expires in <strong style="color:#f59e0b;">${vendor.daysLeft} day(s)</strong>`
    : isExpired
      ? `<strong style="color:#ef4444;">انتهت صلاحيته</strong>`
      : `تنتهي صلاحيته خلال <strong style="color:#f59e0b;">${vendor.daysLeft} يوم</strong>`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn
      ? `${isExpired ? "Document expired" : "Document expiring soon"} — ${docLabel} — Build Saudi`
      : `${isExpired ? "انتهت صلاحية مستند" : "قرب انتهاء صلاحية مستند"} — ${docLabel} — Build Saudi`,
    html: emailShell({
      lang,
      previewText: isEn
        ? `${docLabel} for ${vendor.establishment_name} ${isExpired ? "has expired" : `expires in ${vendor.daysLeft} day(s)`}`
        : `${docLabel} لمنشأة ${vendor.establishment_name} ${isExpired ? "انتهت صلاحيته" : `تنتهي صلاحيته خلال ${vendor.daysLeft} يوم`}`,
      accentColor: isExpired ? "#ef4444" : "#f59e0b",
      badgeIcon: isExpired ? "⛔" : "⏰",
      badgeLabel: isEn ? (isExpired ? "Document expired" : "Document expiring soon") : (isExpired ? "مستند منتهي الصلاحية" : "قرب انتهاء صلاحية مستند"),
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          Your document <strong style="color:#1D3F1F;">${esc(docLabel)}</strong> on file with Build Saudi ${statusLine} (${esc(vendor.expiryDate)}).
        </p>
        ${highlightBox("Please upload an updated copy through your supplier profile to keep your account in good standing.", isExpired ? "#ef4444" : "#f59e0b")}
        ${signOff}
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.8;">
          مستند <strong style="color:#1D3F1F;">${esc(docLabel)}</strong> المسجّل لدى Build Saudi ${statusLine} (${esc(vendor.expiryDate)}).
        </p>
        ${highlightBox("يُرجى رفع نسخة محدّثة عبر ملف التوريد الخاص بكم للحفاظ على استمرارية الحساب.", isExpired ? "#ef4444" : "#f59e0b")}
        ${signOff}
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
  lang?: "ar" | "en";
}) {
  const lang = vendor.lang ?? "ar";
  const isEn = lang === "en";
  const fullName = `${vendor.manager_name} / ${vendor.establishment_name}`;

  return sendEmail({
    from: FROM,
    to: vendor.email,
    subject: isEn ? "Your application has been received — Build Saudi" : "تم استلام طلب انضمامكم — Build Saudi",
    html: emailShell({
      lang,
      previewText: isEn
        ? `${vendor.establishment_name}'s application to join the Build Saudi supplier network has been received`
        : `تم استلام طلب انضمام ${vendor.establishment_name} إلى شبكة موردي Build Saudi`,
      accentColor: "#09B14B",
      badgeIcon: "📬",
      badgeLabel: isEn ? "Application received" : "تم استلام طلب الانضمام",
      content: isEn
        ? `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          Thank you for your interest in joining the Build Saudi supplier network. We've received your basic information and our team will review it.
        </p>
        ${highlightBox("After preliminary approval, you'll receive a link to complete your supplier profile (categories, banking, and documents). Final approval follows a review of the complete profile.")}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">Best regards,<br/><strong style="color:#1D3F1F;">Build Saudi Team</strong></p>
      `
        : `
        ${greeting(fullName)}
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">
          شكرًا لاهتمامكم بالانضمام إلى شبكة موردي Build Saudi. تم استلام بياناتكم الأساسية وسيراجعها فريقنا.
        </p>
        ${highlightBox("بعد الموافقة الأولية، يصلكم رابط لإكمال ملف التوريد (الفئات، البنك، والمستندات). الاعتماد النهائي بعد مراجعة الملف الكامل.")}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">مع تحياتنا،<br/><strong style="color:#1D3F1F;">فريق Build Saudi</strong></p>
      `,
    }),
  });
}


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
          أدخل الرمز أدناه لإكمال التحقق من بريدك الإلكتروني لدى بيلد.
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
