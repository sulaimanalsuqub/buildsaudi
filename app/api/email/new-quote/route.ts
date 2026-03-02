import { NextRequest, NextResponse } from "next/server";
import { sendNewQuoteNotification, sendQuoteConfirmationToClient } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const quote = await req.json();
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
