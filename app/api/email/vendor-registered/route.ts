import { NextRequest, NextResponse } from "next/server";
import { sendVendorRegistrationConfirmation } from "@/lib/email";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limiting - forms submit this
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "تسجيل موردين");

  try {
    const body = await req.json();

    // التحقق من الحقول المطلوبة
    if (!body.establishment_name || !body.email) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    await sendVendorRegistrationConfirmation(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (vendor-registered):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
