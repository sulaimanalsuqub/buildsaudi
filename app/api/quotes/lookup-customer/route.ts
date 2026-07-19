import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OdooClientError, findCustomerProjectsByEmail } from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";

const lookupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  email_verified_token: z.string().min(10),
});

/** يتطلب إثبات ملكية البريد (نفس توكن OTP) قبل إرجاع أي بيانات — يمنع استخراج معلومات عملاء آخرين بالتخمين */
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "api");
  if (!ok) return rateLimitError(resetAt, "البحث عن عميل");

  const parsed = lookupSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }
  const { email, email_verified_token } = parsed.data;

  if (!verifyEmailToken(email, email_verified_token)) {
    return NextResponse.json({ error: "يجب التحقق من البريد الإلكتروني أولاً" }, { status: 401 });
  }

  try {
    const result = await findCustomerProjectsByEmail(email);
    if (!result) return NextResponse.json({ ok: true, found: false });
    return NextResponse.json({ ok: true, found: true, ...result });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[quotes/lookup-customer][${error.correlationId}] ${error.kind}: ${error.message}`);
      return NextResponse.json({ ok: true, found: false });
    }
    console.error("Customer lookup failed (unexpected):", error);
    return NextResponse.json({ ok: true, found: false });
  }
}
