import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createERPNextSupplierRegistration } from "@/lib/erpnext";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendVendorRegistrationConfirmation } from "@/lib/email";
import { verifyEmailToken } from "@/lib/otp";

const vendorSchema = z.object({
  establishment_name: z.string().trim().min(2),
  manager_name: z.string().trim().min(2),
  contact_number: z.string().trim().min(8),
  email: z.string().trim().email(),
  email_verified_token: z.string(),
  cr_number: z.string().trim().regex(/^\d{10,15}$/),
  vendor_type: z.string().trim().min(1),
  represented_brands: z.string().trim().optional().or(z.literal("")),
  product_categories: z.array(z.string().trim().min(1)).min(1),
  coverage_regions: z.array(z.string().trim().min(1)).min(1),
  has_warehouse: z.boolean(),
  offers_credit: z.boolean(),
  credit_limit: z.number().nonnegative().nullable().optional(),
  payment_terms: z.array(z.string().trim().min(1)).min(1),
  worked_on_gov_projects: z.boolean(),
}).refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
  path: ["email"],
  message: "يجب التحقق من البريد الإلكتروني أولاً",
});

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "تسجيل موردين");

  const parsed = vendorSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات المورد غير مكتملة أو غير صحيحة" }, { status: 400 });
  }

  const vendor = parsed.data;

  let createdSupplier: { name: string };
  try {
    createdSupplier = await createERPNextSupplierRegistration(vendor);
  } catch (error) {
    if (error instanceof Error && error.name === "DuplicateSupplier") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("ERPNext supplier registration failed:", error);
    return NextResponse.json({ error: "تعذر حفظ بيانات المورد في نظام العمليات" }, { status: 500 });
  }

  try {
    await sendVendorRegistrationConfirmation({
      establishment_name: vendor.establishment_name,
      manager_name: vendor.manager_name,
      email: vendor.email,
    });
  } catch (emailError) {
    console.error("Vendor registration email failed:", emailError);
  }

  return NextResponse.json({ ok: true, id: createdSupplier.name });
}
