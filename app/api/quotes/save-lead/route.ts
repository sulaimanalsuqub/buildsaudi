import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OdooClientError, findOrCreateCustomerPartner } from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { isValidVendorPhone, normalizeVendorPhone } from "@/lib/vendor-options";

const saveLeadSchema = z.object({
  contact_name: z.string().trim().min(2),
  company_name: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email(),
  email_verified_token: z.string().min(10),
  phone: z.string().trim().refine(isValidVendorPhone, { message: "invalid phone" }),
});

/**
 * حفظ صامت لبيانات العميل بمجرد التحقق من بريده، قبل ما يكمل باقي النموذج —
 * حتى لو ما أكمل، بيلد يقدر يتابع معه. لا ينشئ طلب توريد (يحتاج مشروع لسه ما تعبّى)،
 * فقط يضمن وجود جهة اتصال (res.partner) بأودو. فشل هذا المسار لا يظهر للمستخدم أبداً.
 */
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "حفظ بيانات العميل");

  const parsed = saveLeadSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }
  const data = parsed.data;

  if (!verifyEmailToken(data.email, data.email_verified_token)) {
    return NextResponse.json({ error: "يجب التحقق من البريد الإلكتروني أولاً" }, { status: 401 });
  }

  try {
    await findOrCreateCustomerPartner({
      contactName: data.contact_name,
      companyName: data.company_name || undefined,
      email: data.email,
      phone: normalizeVendorPhone(data.phone),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[quotes/save-lead][${error.correlationId}] ${error.kind}: ${error.message}`);
    } else {
      console.error("Silent lead save failed (unexpected):", error);
    }
    // صامت دوماً تجاه العميل — هذا مسار مساعد وليس جزءاً من إرسال الطلب الفعلي
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
