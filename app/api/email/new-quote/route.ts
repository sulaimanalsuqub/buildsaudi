import { NextRequest, NextResponse } from "next/server";
import { sendNewQuoteNotification, sendQuoteConfirmationToClient } from "@/lib/email";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limiting - forms submit this
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "طلبات تسعير");

  try {
    const quote = await req.json();

    // التحقق من الحقول المطلوبة
    if (!quote.client_name || !quote.project_name || !quote.phone) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // إشعار الأدمن
    await sendNewQuoteNotification(quote);
    // تأكيد للعميل إذا أدخل إيميله
    if (quote.client_email) {
      await sendQuoteConfirmationToClient(quote);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (new-quote):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
