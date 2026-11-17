import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone, optionLabel, supplierCountries } from "@/lib/vendor-options";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendVendorRegistrationBackupEmail, sendVendorRegistrationConfirmation } from "@/lib/email";
import { MAX_VENDOR_FILES, validateVendorFileMetadata } from "@/lib/vendor-file-policy";
import { createWafeqSupplierContact, isWafeqConfigured } from "@/lib/wafeq";

export const maxDuration = 120;

const BUSINESS_TYPES = [
  "manufacturer",
  "authorized_distributor",
  "distributor",
  "importer",
  "exporter",
  "trader",
  "service_provider",
] as const;

/** يحوّل رمز الدولة الداخلي (مثال: "sa") إلى اسمه المعروض — إن كانت القيمة اسماً بالفعل تُعاد كما هي */
function resolveCountryDisplayName(country: string): string {
  return optionLabel(true, supplierCountries, country.trim());
}

/** يحاول استرجاع رمز ISO من الاسم المعروض (بالعربي أو الإنجليزي) — يرجع undefined لو "دولة أخرى" أو غير معروف */
function resolveCountryCode(countryDisplay: string): string | undefined {
  const match = supplierCountries.find((c) => c.ar === countryDisplay || c.en === countryDisplay);
  if (!match || match.value === "other" || match.value.length !== 2) return undefined;
  return match.value.toUpperCase();
}

const registerSchema = z.object({
  establishment_name: z.string().trim().min(2, "اسم المنشأة مطلوب"),
  country: z.string().trim().min(2, "الدولة مطلوبة"),
  supplier_type: z.enum(["local", "international"]),
  business_type: z.enum(BUSINESS_TYPES),
  contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
  job_title: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  phone: z
    .string()
    .trim()
    .transform((v) => normalizeVendorPhone(v))
    .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
  // Names come from Odoo and are validated again on submission.
  category_names: z.array(z.string().trim().min(1)).min(1, "اختر فئة واحدة على الأقل"),
  other_category_suggestion: z.string().trim().max(200).optional().or(z.literal("")),
  brands: z.array(z.string().trim().min(1)).refine((brands) => brands.every(isEnglishBrandName), "اكتب أسماء العلامات التجارية بالإنجليزي فقط").optional().default([]),
  short_description: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  files: z.array(z.object({ name: z.string(), size: z.number().int(), type: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).refine(f => !validateVendorFileMetadata(f), "ملف غير صالح: الحد الأقصى 3MB لكل ملف")).max(MAX_VENDOR_FILES).optional().default([]),
  preferred_language: z.enum(["ar", "en"]),
  privacy_accepted: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
  terms_accepted: z.literal(true, { message: "يجب الموافقة على شروط التسجيل" }),
  turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
  supplier_currency_id: z.number().int().positive().optional(),
  supplier_payment_term_id: z.number().int().positive().optional(),
  supplier_payment_method_line_id: z.number().int().positive().optional(),
  purchase_incoterm_id: z.number().int().positive().optional(),
  purchase_incoterm_location: z.string().trim().max(200).optional().or(z.literal("")),
});

/** مزامنة best-effort لمورد جديد كـContact في وافق — لا تُفشّل التسجيل */
async function syncVendorToWafeq(externalId: string, name: string, email: string, phone: string) {
  if (!isWafeqConfigured()) return;
  try {
    await createWafeqSupplierContact({ externalId, name, email, phone });
  } catch (error) {
    console.error("[vendors/register] Wafeq contact sync failed (non-blocking):", error instanceof Error ? error.message : error);
  }
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "تسجيل موردين");

  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "بيانات المورد غير مكتملة أو غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const vendor = parsed.data;

  const humanVerified = await verifyTurnstileToken(vendor.turnstile_token, clientId);
  if (!humanVerified) {
    return NextResponse.json({ error: "تعذر التحقق من أنك لست برنامجاً آلياً — أعد تحميل الصفحة وحاول مجدداً" }, { status: 400 });
  }

  const countryDisplay = resolveCountryDisplayName(vendor.country);
  const countryCode = resolveCountryCode(countryDisplay);

  // ⚠️ مؤقت (2026-11-17): ERPNext (Frappe Cloud) معلّق وOdoo (buildsaudi.odoo.com) معطّلة
  // كلياً — كلا الـERPs اللذين كانا يستقبلان هذا النموذج ميتان الآن (307/303 لصفحات حالة الخدمة،
  // لا API حقيقي). بدل رفض كل تسجيل، نحفظ الطلب بمكانين لا يعتمدان على أي ERP: Contact مبدئي في
  // وافق (best-effort) + بريد احتياطي كامل لفريق Build (مصدر الحقيقة الوحيد مؤقتاً). لا كشف تكرار
  // ولا فئات/ملفات تُحفظ آلياً بأي نظام — الفريق يُدخلها يدوياً عند رجوع ERPNext أو Odoo.
  // أعد ربط هذا بـregisterVendorInErpnext/registerVendor (lib/erpnext-vendor-registration.ts،
  // lib/vendor-registration.ts) فور رجوع أحدهما.
  const reference = createHash("sha256")
    .update(JSON.stringify([vendor.establishment_name.trim().toLowerCase(), countryCode || countryDisplay, vendor.email]))
    .digest("hex")
    .slice(0, 16);

  await syncVendorToWafeq(reference, vendor.establishment_name, vendor.email, vendor.phone);

  try {
    await sendVendorRegistrationBackupEmail({
      reference,
      establishment_name: vendor.establishment_name,
      country: countryDisplay,
      supplier_type: vendor.supplier_type,
      business_type: vendor.business_type,
      contact_name: vendor.contact_name,
      job_title: vendor.job_title,
      email: vendor.email,
      phone: vendor.phone,
      category_names: vendor.category_names,
      other_category_suggestion: vendor.other_category_suggestion,
      brands: vendor.brands,
      website: vendor.website,
      fileNames: vendor.files.map((f) => f.name),
    });
  } catch (error) {
    // هذا البريد هو السجل الوحيد للطلب الآن — فشله يعني فشل التسجيل فعلياً، لازم يُعاد المحاولة.
    console.error("[vendors/register] backup email failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذر حفظ الطلب حالياً. حاول مرة أخرى بعد قليل." }, { status: 503 });
  }

  try {
    await sendVendorRegistrationConfirmation({
      establishment_name: vendor.establishment_name,
      manager_name: vendor.contact_name,
      email: vendor.email,
      lang: vendor.preferred_language,
    });
  } catch (emailError) {
    console.error("[vendors/register] confirmation email failed (non-blocking):", emailError instanceof Error ? emailError.message : emailError);
  }

  return NextResponse.json({ ok: true, status: "registered" });
}
