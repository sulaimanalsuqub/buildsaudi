import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createERPNextSupplierBasicRegistration, updateERPNextDocument } from "@/lib/erpnext";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendNewVendorRegistrationNotification, sendVendorRegistrationConfirmation } from "@/lib/email";
import { verifyEmailToken } from "@/lib/otp";
import { isValidVendorPhone, normalizeVendorPhone } from "@/lib/vendor-options";

const basicVendorSchema = z
  .object({
    establishment_name: z.string().trim().min(2, "اسم المنشأة مطلوب"),
    manager_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    contact_number: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "رقم التواصل غير صحيح — سعودي أو دولي بصيغة +رمز الدولة" }),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    cr_number: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,15}$/, "رقم السجل يجب أن يكون 10-15 رقم")),
  })
  .refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
    path: ["email"],
    message: "انتهت صلاحية التحقق من البريد — أعد إرسال رمز OTP والتحقق مرة أخرى",
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

  let createdSupplier: { name: string };
  try {
    createdSupplier = await createERPNextSupplierBasicRegistration(vendor);
  } catch (error) {
    if (error instanceof Error && error.name === "DuplicateSupplier") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("ERPNext supplier registration failed:", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }

  void updateERPNextDocument("Supplier", createdSupplier.name, {
    build_agent_summary: [
      "🤖 تقييم أولي — طلب تسجيل أساسي",
      `المنشأة: ${vendor.establishment_name}`,
      "✅ السجل التجاري بصيغة صحيحة",
      "⏳ في انتظار موافقة الأدمن من ERPNext",
      "📋 بعد الموافقة: يصل للمورد رابط إكمال الملف",
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
      cr_number: vendor.cr_number,
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