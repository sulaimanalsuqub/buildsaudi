import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  createOutboxEvent,
  createPreliminaryPartner,
  createPreliminarySupplierProfile,
  findPartnerByEmail,
  findPartnerByPhone,
  findSupplierByEmailNameCountry,
  findSupplierByNameAndCountry,
  findSupplierProfileByPartner,
  normalizeCompanyName,
  resolveOrCreateBrands,
  validateActiveCategoryIds,
} from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { isValidVendorPhone, normalizeVendorPhone, optionLabel, supplierCountries } from "@/lib/vendor-options";

const CURRENT_POLICY_VERSION = "2026-07-v1";

/** يحوّل رمز الدولة الداخلي (مثال: "sa") إلى اسمه المعروض — إن كانت القيمة اسماً بالفعل تُعاد كما هي */
function resolveCountryDisplayName(country: string): string {
  return optionLabel(true, supplierCountries, country.trim());
}

const registerSchema = z
  .object({
    establishment_name: z.string().trim().min(2, "اسم المنشأة مطلوب"),
    country: z.string().trim().min(2, "الدولة مطلوبة"),
    supplier_type: z.enum(["local", "international"]),
    contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    job_title: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    phone: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    // معرّفات فئات حقيقية من Odoo (Master Data) — لا أسماء نصية حرة
    category_ids: z.array(z.number().int().positive()).min(1, "اختر فئة واحدة على الأقل"),
    other_category_suggestion: z.string().trim().max(200).optional().or(z.literal("")),
    brands: z.array(z.string().trim().min(1)).optional().default([]),
    short_description: z.string().trim().min(5, "أضف وصفاً مختصراً للمواد أو المنتجات"),
    website: z.string().trim().optional().or(z.literal("")),
    catalog_link: z.string().trim().optional().or(z.literal("")),
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
  if (!ok) return rateLimitError(resetAt, "تسجيل موردين");

  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "بيانات المورد غير مكتملة أو غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const vendor = parsed.data;
  const consentAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  // اسم الدولة المعروض — يُحسَب مرة واحدة ويُستخدم في كل الفحوصات والحفظ لضمان التطابق
  const countryDisplay = resolveCountryDisplayName(vendor.country);

  // الفئات Master Data من Odoo فقط — نرفض أي معرّف غير موجود أو غير نشط قبل أي إنشاء
  const categoriesValid = await validateActiveCategoryIds(vendor.category_ids);
  if (!categoriesValid) {
    return NextResponse.json({ error: "فئة أو أكثر لم تعد متاحة — أعد تحميل الصفحة واختر من جديد" }, { status: 400 });
  }

  try {
    // 1) نفس البريد + نفس اسم المنشأة (بعد التطبيع) + الدولة — نفس التسجيل، لا إنشاء
    const exactMatch = await findSupplierByEmailNameCountry(vendor.email, vendor.establishment_name, countryDisplay);
    if (exactMatch) {
      return NextResponse.json({
        ok: true,
        id: String(exactMatch.partner.id),
        status: "already_registered",
        stage: exactMatch.profile.status,
      });
    }

    // 2) نفس البريد، منشأة مختلفة — للمراجعة، لا دمج تلقائي، لا كشف
    const emailMatch = await findPartnerByEmail(vendor.email);
    if (emailMatch) {
      const existingProfile = await findSupplierProfileByPartner(emailMatch.id);
      if (existingProfile) {
        const sameName = normalizeCompanyName(emailMatch.name) === normalizeCompanyName(vendor.establishment_name);
        if (!sameName) {
          console.warn("[vendors/register] needs_review: email matches existing partner with different establishment name");
          return NextResponse.json({ ok: true, status: "needs_review" });
        }
        // نفس البريد ونفس الاسم لكن لم يلتقطه فحص الدولة أعلاه (احتياط دفاعي) — يُعامَل كنفس التسجيل، لا تكرار
        return NextResponse.json({
          ok: true,
          id: String(emailMatch.id),
          status: "already_registered",
          stage: existingProfile.status,
        });
      } else {
        // Partner موجود بلا Profile — إعادة استخدامه (قاعدة 5)
        return await registerOnExistingPartner(emailMatch.id, vendor, countryDisplay, consentAt);
      }
    }

    // 3) نفس الهاتف فقط
    if (!emailMatch) {
      const phoneMatch = await findPartnerByPhone(vendor.phone);
      if (phoneMatch) {
        const existingProfile = await findSupplierProfileByPartner(phoneMatch.id);
        if (existingProfile) {
          console.warn("[vendors/register] needs_review: phone matches existing partner with a supplier profile");
          return NextResponse.json({ ok: true, status: "needs_review" });
        }
        return await registerOnExistingPartner(phoneMatch.id, vendor, countryDisplay, consentAt);
      }
    }

    // 4) نفس اسم المنشأة + الدولة، بيانات اتصال مختلفة
    const nameMatch = await findSupplierByNameAndCountry(vendor.establishment_name, countryDisplay);
    if (nameMatch) {
      console.warn("[vendors/register] needs_review: establishment name + country matches an existing supplier");
      return NextResponse.json({ ok: true, status: "needs_review" });
    }

    // 5) لا تطابق إطلاقاً — تسجيل جديد كامل
    const partnerId = await createPreliminaryPartner({
      establishmentName: vendor.establishment_name,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website || undefined,
    });
    return await finishRegistration(partnerId, vendor, countryDisplay, consentAt);
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[vendors/register][${error.correlationId}] ${error.kind}: ${error.message}`);
      const status = error.kind === "validation" ? 400 : error.kind === "conflict" ? 409 : 500;
      return NextResponse.json({ error: error.publicMessage }, { status });
    }
    console.error("Vendor registration failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }
}

type VendorInput = z.infer<typeof registerSchema>;

async function registerOnExistingPartner(partnerId: number, vendor: VendorInput, countryDisplay: string, consentAt: string) {
  return finishRegistration(partnerId, vendor, countryDisplay, consentAt);
}

async function finishRegistration(partnerId: number, vendor: VendorInput, countryDisplay: string, consentAt: string) {
  const brandIds = await resolveOrCreateBrands(vendor.brands ?? []);

  const profileId = await createPreliminarySupplierProfile(
    partnerId,
    {
      establishmentName: vendor.establishment_name,
      country: countryDisplay,
      supplierType: vendor.supplier_type,
      contactName: vendor.contact_name,
      jobTitle: vendor.job_title || undefined,
      email: vendor.email,
      phone: vendor.phone,
      shortDescription: vendor.short_description,
      website: vendor.website || undefined,
      catalogLink: vendor.catalog_link || undefined,
      preferredLanguage: vendor.preferred_language,
      policyVersion: CURRENT_POLICY_VERSION,
      consentAt,
      otherCategorySuggestion: vendor.other_category_suggestion || undefined,
    },
    vendor.category_ids,
    brandIds
  );

  const idempotencyKey = `supplier.pre_registered:partner-${partnerId}`;
  await createOutboxEvent({
    eventType: "supplier.pre_registered",
    resourceModel: "x_build_supplier_profile",
    resourceId: profileId,
    supplierProfileId: profileId,
    idempotencyKey,
    payload: { partner_id: partnerId, profile_id: profileId },
  });

  return NextResponse.json({ ok: true, id: String(partnerId), status: "registered" });
}
