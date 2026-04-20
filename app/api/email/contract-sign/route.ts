import { NextRequest, NextResponse } from "next/server";
import { sendContractSignLink } from "@/lib/email";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "إرسال عقود");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const body = await req.json();
    if (!body.vendor_email || !body.sign_token) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    await sendContractSignLink(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (contract-sign):", err);
    return NextResponse.json({ ok: false, error: "حدث خطأ" }, { status: 500 });
  }
}