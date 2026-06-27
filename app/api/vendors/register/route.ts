import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createERPNextSupplierBasicRegistration, updateERPNextDocument } from "@/lib/erpnext";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendNewVendorRegistrationNotification, sendVendorRegistrationConfirmation } from "@/lib/email";
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
  const crNumber = isSaudiSupplierCountry(vendor.country)
    ? vendor.cr_number.replace(/\D/g, "")
    : vendor.cr_number.trim();

  let createdSupplier: { name: string };
  try {
    createdSupplier = await createERPNextSupplierBasicRegistration({ ...vendor, cr_number: crNumber });
  } catch (error) {
    if (error instanceof Error && error.name === "DuplicateSupplier") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("ERPNext supplier registration failed:", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }

  void updateERPNextDocument("Supplier", createdSupplier.name, {
    build_agent_summary: [
      "📋 طلب تسجيل أساسي من الموقع",
      `المنشأة: ${vendor.establishment_name}`,
      `الدولة: ${vendor.country}`,
      `الجوال: ${vendor.contact_number}`,
      `السجل: ${crNumber}`,
      "⏳ Review → Approve = إرسال رابط إكمال الملف فقط",
      "⚠️ الاعتماد النهائي بعد مراجعة الملف الكامل والمستندات",
    ].join("\n"),
  }).catch((e) => console.error("Supplier agent summary failed:", e));

  void Promise.allSettled([
    sendVendorRegistrationConfirmation({
      establishment_name: vendor.establishment_name,
      manager_name: vendor.manager_name,
      email: vendor.email,
    }),
    sendNewVendorRegistrationNotification({
      id: createdSupplier.name,
      establishment_name: vendor.establishment_name,
      manager_name: vendor.manager_name,
      contact_number: vendor.contact_number,
      email: vendor.email,
      cr_number: crNumber,
      vendor_type: "pending",
      product_categories: [],
      coverage_regions: [],
    }),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Vendor registration email failed:", result.reason);
      }
    }
  });

  return NextResponse.json({ ok: true, id: createdSupplier.name });
}