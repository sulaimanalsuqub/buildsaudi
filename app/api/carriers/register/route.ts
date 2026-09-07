import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidVendorPhone, normalizeVendorPhone, regions } from "@/lib/vendor-options";

/** يحوّل رموز المناطق الداخلية (مثال: "riyadh") إلى أسمائها العربية — يرمي إن كان الرمز غير معروف */
function translateServiceAreaSlugs(slugs: string[]): string[] | null {
  const names: string[] = [];
  for (const slug of slugs) {
    const region = regions.find((r) => r.value === slug);
    if (!region) return null;
    names.push(region.ar);
  }
  return names;
}

const registerSchema = z
  .object({
    establishment_name: z.string().trim().min(2, "اسم المنشأة مطلوب"),
    country: z.string().trim().min(2, "الدولة مطلوبة"),
    carrier_type: z.enum(["local", "international"]),
    contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    job_title: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    phone: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    service_areas: z.array(z.string().trim().min(1)).min(1, "اختر منطقة خدمة واحدة على الأقل"),
    vehicle_types: z.array(z.string().trim().min(1)).min(1, "اختر نوع مركبة واحد على الأقل"),
    material_categories: z.array(z.string().trim().min(1)).optional().default([]),
    logistics_services: z.array(z.string().trim().min(1)).optional().default([]),
    short_description: z.string().trim().min(5, "أضف وصفاً مختصراً لخدمات النقل"),
    website: z.string().trim().optional().or(z.literal("")),
    preferred_language: z.enum(["ar", "en"]),
    privacy_accepted: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
    terms_accepted: z.literal(true, { message: "يجب الموافقة على شروط التسجيل" }),
    turnstile_token: z.string().optional().default(""),
  })
  .refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
    path: ["email"],
    message: "انتهت صلاحية التحقق من البريد — أعد إرسال رمز OTP والتحقق مرة أخرى",
  });

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "تسجيل ناقلين");

  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "بيانات الناقل غير مكتملة أو غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const carrier = parsed.data;

  const humanVerified = await verifyTurnstileToken(carrier.turnstile_token, clientId);
  if (!humanVerified) {
    return NextResponse.json({ error: "تعذر التحقق من أنك لست برنامجاً آلياً — أعد تحميل الصفحة وحاول مجدداً" }, { status: 400 });
  }

  const serviceAreaNamesAr = translateServiceAreaSlugs(carrier.service_areas);
  if (!serviceAreaNamesAr) {
    return NextResponse.json({ error: "منطقة خدمة غير معروفة — أعد تحميل الصفحة واختر من جديد" }, { status: 400 });
  }

  const baseUrl = process.env.BUILD_OPT_BASE_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[carriers/register] BUILD_OPT_BASE_URL/PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "نظام التسجيل غير مهيّأ حالياً — حاول لاحقاً" }, { status: 503 });
  }

  // ملاحظة: فحوصات التكرار السابقة (نفس البريد/الهاتف/الاسم مع أودو) أُسقطت — نفس القرار
  // المُتَّخذ لتسجيل الموردين (راجع app/api/vendors/register/route.ts)، بنفس السبب: لا مقابل لها
  // بعد بجسر Build-OPT العام. Build-OPT يحمي فقط من إعادة إرسال نفس الطلب (idempotency).
  const submissionId = randomUUID();

  try {
    const res = await fetch(`${baseUrl}/api/public/carrier-registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-secret": secret },
      body: JSON.stringify({
        submissionId,
        establishmentName: carrier.establishment_name,
        countryCode: carrier.country.length === 2 ? carrier.country.toUpperCase() : "SA",
        carrierType: carrier.carrier_type,
        contactName: carrier.contact_name,
        contactTitle: carrier.job_title || undefined,
        contactEmail: carrier.email,
        contactPhone: carrier.phone,
        serviceAreas: serviceAreaNamesAr,
        vehicleTypes: carrier.vehicle_types,
        logisticsServices: carrier.logistics_services,
        materialCategories: carrier.material_categories,
        shortDescription: carrier.short_description,
        website: carrier.website || undefined,
        preferredLanguage: carrier.preferred_language,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`build-opt returned ${res.status}`);
    const body = (await res.json()) as { carrierId?: string };
    return NextResponse.json({ ok: true, id: body.carrierId ?? submissionId, status: "registered" });
  } catch (error) {
    console.error("[carriers/register] failed to reach build-opt:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذر حفظ بيانات الناقل في نظام العمليات" }, { status: 500 });
  }
}
