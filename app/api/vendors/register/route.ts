import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone } from "@/lib/vendor-options";
import { verifyTurnstileToken } from "@/lib/turnstile";

// Odoo is permanently inaccessible (2026-09-14). This now calls Build-OPT's own public
// service-to-service bridge (app/api/public/supplier-registrations/route.ts on
// opt.build.com.sa), which writes straight into its business_parties/supplier_profiles tables —
// the same tables its ops team reviews suppliers in. The bridge's dedup model is simpler than
// the old 5-tier Odoo matching this route used to do (email/phone/name fuzzy matching, a
// needs_review state): it only rejects on a duplicate legal_identifier_value, which this stage
// never collects (CR/VAT comes later in "complete profile"), so duplicate submissions are
// deduped only by submissionId (double-click/retry safe) — occasional duplicate pending
// suppliers are an ops-review nuisance, not a data-integrity issue, and are cheap to merge
// manually until the bridge grows richer matching.
const BUSINESS_TYPES = [
  "manufacturer",
  "authorized_distributor",
  "distributor",
  "importer",
  "exporter",
  "trader",
  "service_provider",
] as const;

const registerSchema = z
  .object({
    establishment_name: z.string().trim().min(2, "اسم المنشأة مطلوب"),
    country: z.string().trim().min(2, "الدولة مطلوبة"),
    supplier_type: z.enum(["local", "international"]),
    business_type: z.enum(BUSINESS_TYPES),
    contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    job_title: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    phone: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    category_names: z.array(z.string().trim().min(1)).min(1, "اختر فئة واحدة على الأقل"),
    other_category_suggestion: z.string().trim().max(200).optional().or(z.literal("")),
    brands: z.array(z.string().trim().min(1)).refine((brands) => brands.every(isEnglishBrandName), "اكتب أسماء العلامات التجارية بالإنجليزي فقط").optional().default([]),
    short_description: z.string().trim().min(5, "أضف وصفاً مختصراً للمواد أو المنتجات"),
    website: z.string().trim().optional().or(z.literal("")),
    catalog_link: z.string().trim().optional().or(z.literal("")),
    preferred_language: z.enum(["ar", "en"]),
    submission_id: z.string().uuid(),
    privacy_accepted: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
    terms_accepted: z.literal(true, { message: "يجب الموافقة على شروط التسجيل" }),
    turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
  })
  .refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
    path: ["email"],
    message: "انتهت صلاحية التحقق من البريد — أعد إرسال رمز OTP والتحقق مرة أخرى",
  });

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

  const baseUrl = process.env.BUILD_OPT_API_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[vendors/register] BUILD_OPT_API_URL / PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/public/supplier-registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-secret": secret },
      body: JSON.stringify({
        submissionId: vendor.submission_id,
        legalName: vendor.establishment_name,
        countryCode: vendor.supplier_type === "local" ? "SA" : undefined,
        categoryNames: vendor.category_names,
        brandNames: vendor.brands,
        contactName: vendor.contact_name,
        contactTitle: vendor.job_title || undefined,
        contactEmail: vendor.email,
        contactPhone: vendor.phone,
        supplierType: vendor.supplier_type,
        businessType: vendor.business_type,
        shortDescription: vendor.short_description,
        website: vendor.website || undefined,
        catalogLink: vendor.catalog_link || undefined,
        preferredLanguage: vendor.preferred_language,
      }),
    });
    const body = (await res.json().catch(() => null)) as { supplierId?: string; error?: string; message?: string } | null;
    if (res.status === 409) {
      return NextResponse.json({ ok: true, status: "already_registered" });
    }
    if (!res.ok) {
      console.error(`[vendors/register] bridge returned ${res.status}: ${body?.error ?? "unknown"}`);
      return NextResponse.json({ error: body?.message || "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: res.status >= 500 ? 500 : 400 });
    }
    return NextResponse.json({ ok: true, id: body?.supplierId, status: "registered" });
  } catch (error) {
    console.error("[vendors/register] bridge unreachable:", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }
}
