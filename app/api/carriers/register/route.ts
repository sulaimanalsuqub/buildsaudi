import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  createOutboxEvent,
  createPreliminaryCarrierProfile,
  createPreliminaryPartner,
  ensurePartnerContact,
  findCarrierByEmailNameCountry,
  findCarrierByNameAndCountry,
  findCarrierProfileByPartner,
  findPartnerByEmail,
  findPartnerByPhone,
  normalizeCompanyName,
  resolveActiveCarrierCategories,
  resolveActiveServiceAreas,
  resolveActiveVehicleTypes,
} from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { isValidVendorPhone, normalizeVendorPhone, regions } from "@/lib/vendor-options";

/** يحوّل رموز المناطق الداخلية (مثال: "riyadh") إلى أسمائها العربية المطابقة لأسماء مناطق الخدمة في أودو — يرمي إن كان الرمز غير معروف */
function translateServiceAreaSlugs(slugs: string[]): string[] | null {
  const names: string[] = [];
  for (const slug of slugs) {
    const region = regions.find((r) => r.value === slug);
    if (!region) return null;
    names.push(region.ar);
  }
  return names;
}

const CURRENT_POLICY_VERSION = "2026-07-v1";

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
    short_description: z.string().trim().min(5, "أضف وصفاً مختصراً لخدمات النقل"),
    website: z.string().trim().optional().or(z.literal("")),
    preferred_language: z.enum(["ar", "en"]),
    privacy_accepted: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
    terms_accepted: z.literal(true, { message: "يجب الموافقة على شروط التسجيل" }),
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
  const consentAt = new Date().toISOString().slice(0, 19).replace("T", " ");

  // نطاقات مرجعية ثابتة (مناطق/مركبات/فئات) — تُطابَق فقط ضد سجلات نشطة موجودة، لا تُنشأ من مدخلات عامة غير موثوقة
  const serviceAreaNamesAr = translateServiceAreaSlugs(carrier.service_areas);
  if (!serviceAreaNamesAr) {
    return NextResponse.json({ error: "منطقة خدمة غير معروفة — أعد تحميل الصفحة واختر من جديد" }, { status: 400 });
  }
  const [serviceAreaIds, vehicleTypeIds, materialCategoryIds] = await Promise.all([
    resolveActiveServiceAreas(serviceAreaNamesAr),
    resolveActiveVehicleTypes(carrier.vehicle_types),
    resolveActiveCarrierCategories(carrier.material_categories ?? []),
  ]);
  if (!serviceAreaIds || !vehicleTypeIds || !materialCategoryIds) {
    return NextResponse.json({ error: "قيمة غير معروفة في مناطق الخدمة أو أنواع المركبات أو الفئات — أعد تحميل الصفحة واختر من جديد" }, { status: 400 });
  }

  try {
    // 1) نفس البريد + نفس اسم المنشأة (بعد التطبيع) + الدولة — نفس التسجيل، لا إنشاء
    const exactMatch = await findCarrierByEmailNameCountry(carrier.email, carrier.establishment_name, carrier.country);
    if (exactMatch) {
      return NextResponse.json({
        ok: true,
        id: String(exactMatch.partner.id),
        status: "already_registered",
        stage: exactMatch.profile.status,
      });
    }

    // 2) نفس البريد، منشأة مختلفة — للمراجعة، لا دمج تلقائي، لا كشف
    const emailMatch = await findPartnerByEmail(carrier.email);
    if (emailMatch) {
      const existingProfile = await findCarrierProfileByPartner(emailMatch.id);
      if (existingProfile) {
        const sameName = normalizeCompanyName(emailMatch.name) === normalizeCompanyName(carrier.establishment_name);
        if (!sameName) {
          console.warn("[carriers/register] needs_review: email matches existing partner with different establishment name");
          return NextResponse.json({ ok: true, status: "needs_review" });
        }
        return NextResponse.json({
          ok: true,
          id: String(emailMatch.id),
          status: "already_registered",
          stage: existingProfile.status,
        });
      } else {
        return await finishRegistration(emailMatch.id, carrier, consentAt, serviceAreaIds, vehicleTypeIds, materialCategoryIds);
      }
    }

    // 3) نفس الهاتف فقط
    if (!emailMatch) {
      const phoneMatch = await findPartnerByPhone(carrier.phone);
      if (phoneMatch) {
        const existingProfile = await findCarrierProfileByPartner(phoneMatch.id);
        if (existingProfile) {
          console.warn("[carriers/register] needs_review: phone matches existing partner with a carrier profile");
          return NextResponse.json({ ok: true, status: "needs_review" });
        }
        return await finishRegistration(phoneMatch.id, carrier, consentAt, serviceAreaIds, vehicleTypeIds, materialCategoryIds);
      }
    }

    // 4) نفس اسم المنشأة + الدولة، بيانات اتصال مختلفة
    const nameMatch = await findCarrierByNameAndCountry(carrier.establishment_name, carrier.country);
    if (nameMatch) {
      console.warn("[carriers/register] needs_review: establishment name + country matches an existing carrier");
      return NextResponse.json({ ok: true, status: "needs_review" });
    }

    // 5) لا تطابق إطلاقاً — تسجيل جديد كامل
    const partnerId = await createPreliminaryPartner({
      establishmentName: carrier.establishment_name,
      contactName: carrier.contact_name,
      jobTitle: carrier.job_title || undefined,
      email: carrier.email,
      phone: carrier.phone,
      website: carrier.website || undefined,
    });
    return await finishRegistration(partnerId, carrier, consentAt, serviceAreaIds, vehicleTypeIds, materialCategoryIds);
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[carriers/register][${error.correlationId}] ${error.kind}: ${error.message}`);
      const status = error.kind === "validation" ? 400 : error.kind === "conflict" ? 409 : 500;
      return NextResponse.json({ error: error.publicMessage }, { status });
    }
    console.error("Carrier registration failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات الناقل في نظام العمليات" }, { status: 500 });
  }
}

type CarrierInput = z.infer<typeof registerSchema>;

async function finishRegistration(
  partnerId: number,
  carrier: CarrierInput,
  consentAt: string,
  serviceAreaIds: number[],
  vehicleTypeIds: number[],
  materialCategoryIds: number[]
) {
  await ensurePartnerContact(partnerId, {
    contactName: carrier.contact_name,
    jobTitle: carrier.job_title || undefined,
    email: carrier.email,
    phone: carrier.phone,
  });

  const profileId = await createPreliminaryCarrierProfile(
    partnerId,
    {
      establishmentName: carrier.establishment_name,
      country: carrier.country,
      carrierType: carrier.carrier_type,
      contactName: carrier.contact_name,
      jobTitle: carrier.job_title || undefined,
      email: carrier.email,
      phone: carrier.phone,
      serviceAreas: carrier.service_areas,
      vehicleTypes: carrier.vehicle_types,
      materialCategories: carrier.material_categories ?? [],
      shortDescription: carrier.short_description,
      website: carrier.website || undefined,
      preferredLanguage: carrier.preferred_language,
      policyVersion: CURRENT_POLICY_VERSION,
      consentAt,
    },
    serviceAreaIds,
    vehicleTypeIds,
    materialCategoryIds
  );

  const idempotencyKey = `carrier.pre_registered:partner-${partnerId}`;
  await createOutboxEvent({
    eventType: "carrier.pre_registered",
    resourceModel: "x_build_carrier_profile",
    resourceId: profileId,
    carrierProfileId: profileId,
    idempotencyKey,
    payload: { partner_id: partnerId, profile_id: profileId },
  });

  return NextResponse.json({ ok: true, id: String(partnerId), status: "registered" });
}
