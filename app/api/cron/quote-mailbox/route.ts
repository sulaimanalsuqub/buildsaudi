import { NextRequest, NextResponse } from "next/server";
import { pollQuoteMailbox } from "@/lib/mailbox-imap";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { supplier: null as unknown, freight: null as unknown };
  try {
    results.supplier = await pollQuoteMailbox("supplier");
  } catch (error) {
    console.error("[cron/quote-mailbox] supplier poll failed:", error instanceof Error ? error.message : error);
    results.supplier = { error: error instanceof Error ? error.message : String(error) };
  }
  try {
    results.freight = await pollQuoteMailbox("freight");
  } catch (error) {
    console.error("[cron/quote-mailbox] freight poll failed:", error instanceof Error ? error.message : error);
    results.freight = { error: error instanceof Error ? error.message : String(error) };
  }

  return NextResponse.json({ ok: true, ...results });
}
