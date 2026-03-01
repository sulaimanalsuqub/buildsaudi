import { NextRequest, NextResponse } from "next/server";
import { sendNewQuoteNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const quote = await req.json();
    await sendNewQuoteNotification(quote);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (new-quote):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
