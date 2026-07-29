import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendOpsAlertEmail } from "@/lib/email";
import { processQuoteReply } from "@/lib/quote-intake";
import { extractEmailAddress, resolveInboundContent } from "@/lib/resend-inbound";
import { claimSubmission, saveSubmissionState, type SubmissionState } from "@/lib/shared-store";
import { retryableInboundOutcome, terminalInboundOutcome } from "@/lib/inbound-webhook-policy";

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
  attachment_review_required: "مرفق العرض يحتاج مراجعة تشغيلية",
};

export type InboundDeps = {
  resolveInboundContent: typeof resolveInboundContent;
  processQuoteReply: typeof processQuoteReply;
  sendOpsAlertEmail: typeof sendOpsAlertEmail;
  claimSubmission: typeof claimSubmission;
  saveSubmissionState: typeof saveSubmissionState;
};
const defaultDeps: InboundDeps = { resolveInboundContent, processQuoteReply, sendOpsAlertEmail, claimSubmission, saveSubmissionState };

export async function handleInboundWebhook(req: NextRequest, deps: InboundDeps = defaultDeps) {
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

  const eventId = req.headers.get("svix-id")!;
  const eventKey = `webhook-event:${eventId}`;
  const eventInitial = { status: "processing" as const, operation: "webhook_event" as const, submissionId: eventId, correlationId: eventId, stage: "received" };
  let eventState: SubmissionState = eventInitial;
  try {
    const claimed = await deps.claimSubmission(eventKey, eventInitial);
    eventState = claimed.state;
    if (!claimed.claimed) {
      if (claimed.state.status === "completed") return NextResponse.json({ ok: true, replayed: true });
      // Return retryable failure while a valid lease is active. A crashed worker lease
      // expires, then a provider retry can reclaim it without duplicate processing.
      return NextResponse.json({ error: "Webhook event is still processing" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Webhook idempotency unavailable" }, { status: 503 });
  }
  const completeEvent = async (stage: string) => deps.saveSubmissionState(eventKey, { ...eventState, status: "completed", stage });
  const failEvent = async (error: unknown) => deps.saveSubmissionState(eventKey, { ...eventState, status: "failed", stage: "failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) });

  const data = payload.data;
  const fromEmail = extractEmailAddress(data.from);
  const subject = typeof data.subject === "string" ? data.subject : "";
  let text = "";
  let attachmentCount = 0;
  try {
    const content = await deps.resolveInboundContent(data);
    text = [content.text, content.attachmentText].filter(Boolean).join("\n\n---\n\n");
    attachmentCount = content.attachmentCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[rfq/inbound-email] failed to retrieve received email:", message);
    await deps.sendOpsAlertEmail({
      subject: "وصل رد RFQ لكن تعذر جلب محتوى الرسالة من Resend",
      details: [
        { label: "المرسل", value: typeof data.from === "string" ? data.from : "غير معروف" },
        { label: "الموضوع", value: subject || "بلا موضوع" },
        { label: "الخطأ", value: message.slice(0, 300) },
      ],
    }).catch(() => undefined);
    // خطأ provider مؤقت؛ نعيد 500 كي يعيد Resend تسليم الحدث بدلاً من إسقاط الرد نهائياً.
    const outcome = await retryableInboundOutcome(error, failEvent);
    return NextResponse.json({ error: "Unable to retrieve inbound email" }, { status: outcome.status });
  }
  const trackingMatch = subject.match(TRACKING_NUMBER_PATTERN);
  const correlationMatch = subject.match(RFQ_CORRELATION_PATTERN);

  // Terminal malformed/unmatched messages are acknowledged only after their ops alert
  // has been recorded. Infrastructure failures below remain retryable.
  if (!fromEmail || !trackingMatch || !correlationMatch || (text.length < 5 && !attachmentCount)) {
    await deps.sendOpsAlertEmail({
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
    });
    const outcome = await terminalInboundOutcome("unmatched_email", () => completeEvent("unmatched_email"));
    return NextResponse.json(outcome.body, { status: outcome.status });
  }

  try {
    const result = await deps.processQuoteReply({
      trackingNumber: trackingMatch[1],
      correlation: correlationMatch[1],
      email: fromEmail,
      rawText: text,
      attachmentOnly: text.length < 5 && attachmentCount > 0,
      attachmentReference: typeof data.email_id === "string" ? data.email_id : undefined,
      // Svix guarantees a unique delivery event id; the durable store makes retries/replays harmless.
      idempotencyKey: req.headers.get("svix-id") || undefined,
    });
    if (!result.ok) {
      await deps.sendOpsAlertEmail({
        subject: "رد RFQ وصل لكن تعذر تسجيله كعرض سعر",
        details: [
          { label: "المرسل", value: fromEmail },
          { label: "رقم التتبع", value: trackingMatch[1] },
          { label: "السبب", value: FAILURE_LABELS[result.reason] ?? result.reason },
        ],
        rawText: text,
      }).catch((error) => console.error("[rfq/inbound-email] ops alert failed:", error instanceof Error ? error.message : error));
      const outcome = await terminalInboundOutcome(result.reason, () => completeEvent(result.reason));
      return NextResponse.json(outcome.body, { status: outcome.status });
    }
    await completeEvent("quote_processed");
    return NextResponse.json({ ok: true, quoteId: result.quoteId, quoteType: result.quoteType, confidence: result.confidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[rfq/inbound-email] processing failed:", message);
    await deps.sendOpsAlertEmail({
      subject: "خطأ غير متوقع أثناء معالجة رد RFQ وارد",
      details: [
        { label: "المرسل", value: fromEmail },
        { label: "رقم التتبع", value: trackingMatch[1] },
        { label: "الخطأ", value: message.slice(0, 300) },
      ],
      rawText: text,
    }).catch(() => undefined);
    const outcome = await retryableInboundOutcome(error, failEvent);
    return NextResponse.json(outcome.body, { status: outcome.status });
  }
}

export async function POST(req: NextRequest) { return handleInboundWebhook(req); }
