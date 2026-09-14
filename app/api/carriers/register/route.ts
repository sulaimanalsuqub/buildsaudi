import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidVendorPhone, normalizeVendorPhone, regions } from "@/lib/vendor-options";

// Odoo is permanently inaccessible (2026-09-14). Calls Build-OPT's public bridge
// (app/api/public/carrier-registrations/route.ts) which stores service_areas/vehicle_types/
// logistics_services as plain text[] columns on its own `carriers` table — no reference-table
// lookup/validation there (unlike the old Odoo path, which resolved against
// x_build_service_area/x_build_vehicle_type Master Data and rejected unknown values). Same
// simplified dedup tradeoff as vendors/register: the bridge only dedupes by submissionId, no
// fuzzy email/phone/name matching or needs_review state.
function translateServiceAreaSlugs(slugs: string[]): string[] {
  return slugs.map((slug) => regions.find((r) => r.value === slug)?.ar ?? slug);
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
    submission_id: z.string().uuid(),
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

  const baseUrl = process.env.BUILD_OPT_API_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[carriers/register] BUILD_OPT_API_URL / PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "تعذر حفظ بيانات الناقل في نظام العمليات" }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/public/carrier-registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-secret": secret },
      body: JSON.stringify({
        submissionId: carrier.submission_id,
        establishmentName: carrier.establishment_name,
        countryCode: carrier.carrier_type === "local" ? "SA" : undefined,
        carrierType: carrier.carrier_type,
        contactName: carrier.contact_name,
        contactTitle: carrier.job_title || undefined,
        contactEmail: carrier.email,
        contactPhone: carrier.phone,
        serviceAreas: translateServiceAreaSlugs(carrier.service_areas),
        vehicleTypes: carrier.vehicle_types,
        logisticsServices: carrier.logistics_services,
        materialCategories: carrier.material_categories,
        shortDescription: carrier.short_description,
        website: carrier.website || undefined,
        preferredLanguage: carrier.preferred_language,
      }),
    });
    const body = (await res.json().catch(() => null)) as { carrierId?: string; error?: string; message?: string } | null;
    if (res.status === 409) {
      return NextResponse.json({ ok: true, status: "already_registered" });
    }
    if (!res.ok) {
      console.error(`[carriers/register] bridge returned ${res.status}: ${body?.error ?? "unknown"}`);
      return NextResponse.json({ error: body?.message || "تعذر حفظ بيانات الناقل في نظام العمليات" }, { status: res.status >= 500 ? 500 : 400 });
    }
    return NextResponse.json({ ok: true, id: body?.carrierId, status: "registered" });
  } catch (error) {
    console.error("[carriers/register] bridge unreachable:", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات الناقل في نظام العمليات" }, { status: 500 });
  }
}
