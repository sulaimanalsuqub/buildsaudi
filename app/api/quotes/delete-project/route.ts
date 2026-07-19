import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OdooClientError, deleteCustomerProject, findPartnerByEmail } from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";

const deleteSchema = z.object({
  project_id: z.number().int().positive(),
  email: z.string().trim().toLowerCase().email(),
  email_verified_token: z.string().min(10),
});

/** يتحقق من ملكية البريد (OTP) ثم من ملكية المشروع لنفس العميل قبل الحذف المنطقي — يمنع حذف مشاريع عملاء آخرين */
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "api");
  if (!ok) return rateLimitError(resetAt, "حذف المشروع");

  const parsed = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }
  const { project_id, email, email_verified_token } = parsed.data;

  if (!verifyEmailToken(email, email_verified_token)) {
    return NextResponse.json({ error: "يجب التحقق من البريد الإلكتروني أولاً" }, { status: 401 });
  }

  try {
    const partner = await findPartnerByEmail(email);
    if (!partner) {
      return NextResponse.json({ error: "لا يوجد حساب مرتبط بهذا البريد" }, { status: 404 });
    }
    const deleted = await deleteCustomerProject(project_id, partner.id);
    if (!deleted) {
      return NextResponse.json({ error: "تعذر حذف هذا المشروع" }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[quotes/delete-project][${error.correlationId}] ${error.kind}: ${error.message}`);
      return NextResponse.json({ error: "تعذر حذف المشروع حالياً" }, { status: 500 });
    }
    console.error("Delete project failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حذف المشروع حالياً" }, { status: 500 });
  }
}
