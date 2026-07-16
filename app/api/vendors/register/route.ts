import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  createOutboxEvent,
  createSupplierPartner,
  createSupplierProfile,
  findPartnerByCR,
  findPartnerByEmail,
  findPartnerByPhone,
  findSupplierProfileByPartner,
  normalizeCR,
} from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { intlRegistrationRegex, isSaudiSupplierCountry, isValidVendorPhone, normalizeVendorPhone } from "@/lib/vendor-options";

const basicVendorSchema = z
  .object({
    establishment_name: z.string().trim().min(2, "اسم المنشأة مطلوب"),
    manager_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    contact_number: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    country: z.string().trim().min(1).default("sa"),
    cr_number: z.string().trim().min(1, "رقم التسجيل مطلوب"),
  })
  .refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
    path: ["email"],
    message: "انتهت صلاحية التحقق من البريد — أعد إرسال رمز OTP والتحقق مرة أخرى",
  })
  .superRefine((data, ctx) => {
    const valid = isSaudiSupplierCountry(data.country)
      ? /^\d{10,15}$/.test(data.cr_number.replace(/\D/g, ""))
      : intlRegistrationRegex.test(data.cr_number);
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cr_number"],
        message: isSaudiSupplierCountry(data.country)
          ? "رقم السجل يجب أن يكون 10-15 رقم"
          : "رقم تسجيل الشركة غير صحيح",
      });
    }
  });

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "تسجيل موردين");

  const parsed = basicVendorSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "بيانات المورد غير مكتملة أو غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const vendor = parsed.data;
  const supplierType = isSaudiSupplierCountry(vendor.country) ? "local" : "international";
  const crNumber = isSaudiSupplierCountry(vendor.country)
    ? vendor.cr_number.replace(/\D/g, "")
    : vendor.cr_number.trim();

  try {
    // 1) تطابق السجل التجاري — يُعامَل كمصدر الحقيقة الأساسي لهوية المورد
    const crMatch = await findPartnerByCR(crNumber);
    if (crMatch) {
      return NextResponse.json({
        ok: true,
        id: String(crMatch.partner.id),
        status: "already_registered",
        stage: crMatch.profile.status,
      });
    }

    // 2) تطابق البريد أو الجوال — لا دمج تلقائي، لا إنشاء صامت عند وجود ملف مورد فعلي
    const emailMatch = await findPartnerByEmail(vendor.email);
    const phoneMatch = emailMatch ? null : await findPartnerByPhone(vendor.contact_number);
    const softMatch = emailMatch ?? phoneMatch;

    if (softMatch) {
      const existingProfile = await findSupplierProfileByPartner(softMatch.id);
      if (existingProfile) {
        // بريد/جوال يتقاطع مع مورد قائم فعلياً برقم سجل مختلف — للمراجعة اليدوية، لا دمج تلقائي
        console.warn(
          `[vendors/register] needs_review: email/phone matches existing supplier partner (internal id only, no PII logged)`
        );
        return NextResponse.json({ ok: true, status: "needs_review" });
      }

      // جهة اتصال موجودة (بلا ملف مورد) — إعادة استخدام نفس Partner، إنشاء ملف مورد جديد عليه
      const profileId = await createSupplierProfile(softMatch.id, {
        supplierType,
        crNumber,
        managerName: vendor.manager_name,
      });
      const idempotencyKey = `supplier.pre_registered:${normalizeCR(crNumber)}`;
      await createOutboxEvent({
        eventType: "supplier.pre_registered",
        resourceModel: "x_build_supplier_profile",
        resourceId: profileId,
        supplierProfileId: profileId,
        idempotencyKey,
        payload: { partner_id: softMatch.id, profile_id: profileId },
      });
      return NextResponse.json({ ok: true, id: String(softMatch.id), status: "registered" });
    }

    // 3) لا تطابق إطلاقاً — تسجيل جديد كامل
    const partnerId = await createSupplierPartner({
      establishmentName: vendor.establishment_name,
      email: vendor.email,
      phone: vendor.contact_number,
    });
    const profileId = await createSupplierProfile(partnerId, {
      supplierType,
      crNumber,
      managerName: vendor.manager_name,
    });

    const idempotencyKey = `supplier.pre_registered:${normalizeCR(crNumber)}`;
    await createOutboxEvent({
      eventType: "supplier.pre_registered",
      resourceModel: "x_build_supplier_profile",
      resourceId: profileId,
      supplierProfileId: profileId,
      idempotencyKey,
      payload: { partner_id: partnerId, profile_id: profileId },
    });

    return NextResponse.json({ ok: true, id: String(partnerId), status: "registered" });
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
