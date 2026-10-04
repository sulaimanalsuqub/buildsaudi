import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/bearer-auth";
import { isErpnextConfigured } from "@/lib/erpnext";
import { isZohoMailConfigured, listUnreadInbox, getMessageText, markRead, extractSender } from "@/lib/zoho-mail";
import { processQuoteReplyErpnext } from "@/lib/erpnext-rfq";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// يسحب ردود الموردين على RFQ من صندوق Zoho (partners@build.sa) عبر Zoho Mail API،
// ويحوّل كل رد يحمل [RFQID:<token>] إلى Draft Supplier Quotation في ERPNext.
// يُشغّل عبر Vercel Cron (محميّ بـCRON_SECRET). بديل Resend inbound (IMAP معطّل في خطة Zoho).

const RFQ_CORRELATION_PATTERN = /\[RFQID:([A-Za-z0-9_-]{32,})\]/;

export async function GET(req: NextRequest) {
  if (!verifyBearerSecret(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isErpnextConfigured() || !isZohoMailConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  let emails;
  try {
    emails = await listUnreadInbox(50);
  } catch (error) {
    console.error("[cron/zoho-rfq-intake] list failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "zoho_list_failed" }, { status: 503 });
  }

  const results: { messageId: string; outcome: string }[] = [];
  for (const mail of emails) {
    const match = mail.subject.match(RFQ_CORRELATION_PATTERN);
    if (!match) {
      // ليس رد RFQ — نتجاهله ونتركه كما هو (لا نعلّمه مقروءاً كي لا نخفي بريد الفريق)
      continue;
    }
    const correlation = match[1];
    const sender = extractSender(mail.fromAddress);
    try {
      const text = await getMessageText(mail.folderId, mail.messageId);
      const result = await processQuoteReplyErpnext({
        trackingNumber: "",
        correlation,
        email: sender,
        rawText: text,
        attachmentOnly: text.trim().length < 5,
        idempotencyKey: `zoho:${mail.messageId}`,
      });
      // ننهي الرسالة (نعلّمها مقروءة) عند أي نتيجة نهائية — نجاح أو رفض غير قابل لإعادة المحاولة
      await markRead(mail.messageId);
      results.push({ messageId: mail.messageId, outcome: result.ok ? `quote:${result.quoteId}` : result.reason });
    } catch (error) {
      // خطأ عابر (شبكة/ERPNext 5xx): اتركها غير مقروءة لتُعاد في الدورة القادمة
      console.error(`[cron/zoho-rfq-intake] ${mail.messageId} retryable error:`, error instanceof Error ? error.message : error);
      results.push({ messageId: mail.messageId, outcome: "retry_next_run" });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: emails.length,
    processed: results.length,
    created: results.filter((r) => r.outcome.startsWith("quote:")).length,
    results,
  });
}
