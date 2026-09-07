import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone, optionLabel, supplierCountries } from "@/lib/vendor-options";
import { verifyTurnstileToken } from "@/lib/turnstile";

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
  // أسماء فئات حقيقية (Build-OPT يطابقها بالاسم) — لا معرّفات رقمية داخلية بعد الآن
  category_names: z.array(z.string().trim().min(1)).min(1, "اختر فئة واحدة على الأقل"),
  other_category_suggestion: z.string().trim().max(200).optional().or(z.literal("")),
  brands: z.array(z.string().trim().min(1)).refine((brands) => brands.every(isEnglishBrandName), "اكتب أسماء العلامات التجارية بالإنجليزي فقط").optional().default([]),
  short_description: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  catalog_link: z.string().trim().optional().or(z.literal("")),
  preferred_language: z.enum(["ar", "en"]),
  privacy_accepted: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
  terms_accepted: z.literal(true, { message: "يجب الموافقة على شروط التسجيل" }),
  turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
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

  const baseUrl = process.env.BUILD_OPT_BASE_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[vendors/register] BUILD_OPT_BASE_URL/PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "نظام التسجيل غير مهيّأ حالياً — حاول لاحقاً" }, { status: 503 });
  }

  const countryDisplay = resolveCountryDisplayName(vendor.country);

  // ملاحظة مهمة: نقلنا التسجيل من أودو إلى Build-OPT (2026-09-07، بعد توقف أودو عن العمل بالكامل
  // بسبب ترقية معلّقة خارجة عن سيطرتنا). فحوصات التكرار السابقة (نفس البريد/الهاتف/الاسم مع أودو)
  // أُسقطت مؤقتاً — كانت تعتمد على استعلامات أودو المباشرة التي لا مقابل لها بعد بجسر Build-OPT
  // العام. Build-OPT نفسه يحمي فقط من إعادة إرسال نفس الطلب (idempotency على submissionId)، لا من
  // تسجيل نفس المنشأة مرتين بمحاولتين منفصلتين. هذا تنازل واعٍ لإعادة تشغيل التسجيل فوراً — يحتاج
  // إعادة بناء لاحقاً (فحص تكرار داخل Build-OPT نفسه) بدل إسقاطه نهائياً.
  const submissionId = randomUUID();

  try {
    const res = await fetch(`${baseUrl}/api/public/supplier-registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-secret": secret },
      body: JSON.stringify({
        submissionId,
        legalName: vendor.establishment_name,
        countryCode: resolveCountryCode(countryDisplay),
        categoryNames: vendor.category_names,
        brandNames: vendor.brands ?? [],
        contactName: vendor.contact_name,
        contactTitle: vendor.job_title || undefined,
        contactEmail: vendor.email,
        contactPhone: vendor.phone,
        supplierType: vendor.supplier_type,
        businessType: vendor.business_type,
        shortDescription: vendor.short_description || undefined,
        website: vendor.website || undefined,
        catalogLink: vendor.catalog_link || undefined,
        preferredLanguage: vendor.preferred_language,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 409) {
      return NextResponse.json({ ok: true, status: "already_registered" });
    }
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      if (body?.error === "no_matching_categories") {
        return NextResponse.json({ error: "فئة أو أكثر لم تعد متاحة — أعد تحميل الصفحة واختر من جديد" }, { status: 400 });
      }
      return NextResponse.json({ error: "بيانات المورد غير مكتملة أو غير صحيحة" }, { status: 400 });
    }
    if (!res.ok) throw new Error(`build-opt returned ${res.status}`);

    const body = (await res.json()) as { supplierId?: string };
    return NextResponse.json({ ok: true, id: body.supplierId ?? submissionId, status: "registered" });
  } catch (error) {
    console.error("[vendors/register] failed to reach build-opt:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }
}
