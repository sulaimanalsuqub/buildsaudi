import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendOpsAlertEmail } from "@/lib/email";
import { processQuoteReply } from "@/lib/quote-intake";
import { extractEmailAddress, resolveInboundContent } from "@/lib/resend-inbound";

// نقطة استقبال Resend Inbound (webhook) — القناة التلقائية لردود الموردين/الناقلين على RFQ.
// حلّت محل قارئ IMAP (Zoho يحجب IMAP على الخطة الحالية). التفعيل يحتاج من لوحة Resend:
// إضافة دومين استقبال (مثل rfq.build.sa) بسجلات MX + webhook لحدث email.received يشير لهذا المسار،
// ثم ضبط RESEND_INBOUND_WEBHOOK_SECRET (قيمة whsec_... من إعدادات الـwebhook) في متغيرات البيئة.
export const maxDuration = 60;

// يستخرج رقم التتبع من سطر الموضوع رغم أي بادئة رد (Re:/RE:/رد:) تضيفها برامج البريد
const TRACKING_NUMBER_PATTERN = /(BLD-\d{6}-[A-Z0-9]+)/i;
const RFQ_CORRELATION_PATTERN = /\[RFQID:([A-Za-z0-9_-]{32,})\]/;
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/** تحقق توقيع Svix (المعيار الذي توقّع به Resend كل الـwebhooks) — HMAC-SHA256 على "id.timestamp.body" بمفتاح whsec_ بعد فك base64 */
function verifySvixSignature(req: NextRequest, rawBody: string, secret: string): boolean {
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signatureHeader = req.headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  const expectedBuf = Buffer.from(expected);

  // الترويسة قد تحمل أكثر من توقيع مفصولة بمسافات، كلٌّ بصيغة "v1,<base64>"
  return signatureHeader.split(" ").some((part) => {
    const [version, signature] = part.split(",");
    if (version !== "v1" || !signature) return false;
    const candidate = Buffer.from(signature);
    return candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf);
  });
}

const FAILURE_LABELS: Record<string, string> = {
  request_not_found: "لا يوجد طلب برقم التتبع المذكور بالموضوع",
  partner_not_matched: "بريد المرسل ليس ضمن المرسَل لهم RFQ لهذا الطلب",
  extraction_failed: "تعذر استخلاص بيانات العرض من نص الرد",
};

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Inbound webhook is not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  if (!verifySvixSignature(req, rawBody, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (payload.type !== "email.received" || !payload.data) {
    // أحداث أخرى (تسليم/فتح...) لو وُجّهت لنفس الـwebhook خطأً — نتجاهلها بنجاح كي لا يعيد Resend المحاولة
    return NextResponse.json({ ok: true, skipped: "not_email_received" });
  }

  const data = payload.data;
  const fromEmail = extractEmailAddress(data.from);
  const subject = typeof data.subject === "string" ? data.subject : "";
  let text = "";
  let attachmentCount = 0;
  try {
    const content = await resolveInboundContent(data);
    text = [content.text, content.attachmentText].filter(Boolean).join("\n\n---\n\n");
    attachmentCount = content.attachmentCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[rfq/inbound-email] failed to retrieve received email:", message);
    await sendOpsAlertEmail({
      subject: "وصل رد RFQ لكن تعذر جلب محتوى الرسالة من Resend",
      details: [
        { label: "المرسل", value: typeof data.from === "string" ? data.from : "غير معروف" },
        { label: "الموضوع", value: subject || "بلا موضوع" },
        { label: "الخطأ", value: message.slice(0, 300) },
      ],
    }).catch(() => undefined);
    // خطأ provider مؤقت؛ نعيد 500 كي يعيد Resend تسليم الحدث بدلاً من إسقاط الرد نهائياً.
    return NextResponse.json({ error: "Unable to retrieve inbound email" }, { status: 500 });
  }
  const trackingMatch = subject.match(TRACKING_NUMBER_PATTERN);
  const correlationMatch = subject.match(RFQ_CORRELATION_PATTERN);

  // من هنا فصاعداً نرجع 200 دائماً: إعادة محاولة Resend لن تصلح رسالة ناقصة، والتنبيه الداخلي يضمن ألا يضيع رد فعلي بصمت
  if (!fromEmail || !trackingMatch || !correlationMatch || (text.length < 5 && !attachmentCount)) {
    await sendOpsAlertEmail({
      subject: "بريد وارد على قناة RFQ تعذر ربطه",
      details: [
        { label: "المرسل", value: typeof data.from === "string" ? data.from : "غير معروف" },
        { label: "الموضوع", value: subject || "بلا موضوع" },
        {
          label: "السبب",
          value: !fromEmail
            ? "عنوان مرسل غير صالح"
            : !trackingMatch
              ? "لا يوجد رقم تتبع بالموضوع"
              : !correlationMatch
                ? "لا يوجد رمز RFQ فريد بالموضوع؛ لا نستخدم تخميناً لربط الرد"
              : attachmentCount
                ? "الرسالة بلا نص وتحتوي مرفقاً؛ تحتاج معالجة يدوية"
                : "نص الرسالة فارغ",
        },
      ],
      rawText: text,
    }).catch((error) => console.error("[rfq/inbound-email] ops alert failed:", error instanceof Error ? error.message : error));
    return NextResponse.json({ ok: true, skipped: "unmatched_email" });
  }

  try {
    const result = await processQuoteReply({
      trackingNumber: trackingMatch[1],
      correlation: correlationMatch[1],
      email: fromEmail,
      rawText: text,
      attachmentOnly: text.length < 5 && attachmentCount > 0,
      // Svix guarantees a unique delivery event id; the durable store makes retries/replays harmless.
      idempotencyKey: req.headers.get("svix-id") || undefined,
    });
    if (!result.ok) {
      await sendOpsAlertEmail({
        subject: "رد RFQ وصل لكن تعذر تسجيله كعرض سعر",
        details: [
          { label: "المرسل", value: fromEmail },
          { label: "رقم التتبع", value: trackingMatch[1] },
          { label: "السبب", value: FAILURE_LABELS[result.reason] ?? result.reason },
        ],
        rawText: text,
      }).catch((error) => console.error("[rfq/inbound-email] ops alert failed:", error instanceof Error ? error.message : error));
      return NextResponse.json({ ok: true, skipped: result.reason });
    }
    return NextResponse.json({ ok: true, quoteId: result.quoteId, quoteType: result.quoteType, confidence: result.confidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[rfq/inbound-email] processing failed:", message);
    await sendOpsAlertEmail({
      subject: "خطأ غير متوقع أثناء معالجة رد RFQ وارد",
      details: [
        { label: "المرسل", value: fromEmail },
        { label: "رقم التتبع", value: trackingMatch[1] },
        { label: "الخطأ", value: message.slice(0, 300) },
      ],
      rawText: text,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, skipped: "processing_error" });
  }
}
