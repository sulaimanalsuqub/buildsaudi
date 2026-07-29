import {
  checkAndTriggerWinnerSelection,
  createSupplierQuote,
  findPartnerIdByEmailAndRequest,
  findRequestIdByTrackingNumber,
  findSentCommunicationByCorrelation,
  findSentCommunicationForPartner,
  postProcurementRequestNote,
  read,
} from "@/lib/odoo";
import { extractQuoteFromReply } from "@/lib/quote-extraction";
import { claimSubmission, saveSubmissionState } from "@/lib/shared-store";
import { createHash, randomUUID } from "crypto";

export type QuoteIntakeResult =
  | { ok: true; quoteId: number; quoteType: "supplier" | "freight"; confidence: number }
  | { ok: false; reason: "request_not_found" | "partner_not_matched" | "extraction_failed" };

/** يعالج رد مورد/ناقل على RFQ (نصاً حراً) ويحوّله لعرض سعر منظَّم في Odoo — تُستخدم من نقطة الاستقبال اليدوية ومن قارئ البريد الوارد معاً */
export async function processQuoteReply(params: {
  trackingNumber: string;
  email: string;
  rawText: string;
  /** Token embedded in the original RFQ subject. Required for automatic association. */
  correlation?: string;
  attachmentOnly?: boolean;
  idempotencyKey?: string;
}): Promise<QuoteIntakeResult> {
  const contentHash = createHash("sha256").update(`${params.trackingNumber}\n${params.email}\n${params.rawText}`).digest("hex");
  // The content/correlation identity protects against a provider delivering the
  // same email under a new event id as well as normal Svix replay.
  const quoteIdentity = `${params.correlation || params.trackingNumber}:${contentHash}`;
  const key = `quote-intake:${quoteIdentity}`;
  const initial = { status: "processing" as const, submissionId: quoteIdentity, correlationId: randomUUID(), stage: "received" };
  const claim = await claimSubmission(key, initial);
  if (!claim.claimed) {
    if (claim.state.status === "completed" && claim.state.requestId) {
      return { ok: true, quoteId: claim.state.requestId, quoteType: claim.state.quoteType || "supplier", confidence: 1 };
    }
    return { ok: false, reason: "extraction_failed" };
  }
  try {
  // A tracking number identifies a procurement request, but not one communication: a
  // supplier/carrier may receive several RFQs.  The per-communication token is the
  // authoritative association for automatic intake.
  const matched = params.correlation ? await findSentCommunicationByCorrelation(params.correlation, params.email) : null;
  if (!matched) {
    // Legacy/manual callers retain the conservative sender + request fallback.  The
    // inbound Resend route never uses it; it requires the correlation token.
    if (params.correlation) {
      await saveSubmissionState(key, { ...initial, status: "completed", stage: "partner_not_matched" });
      return { ok: false, reason: "partner_not_matched" };
    }
    const requestId = await findRequestIdByTrackingNumber(params.trackingNumber);
    if (!requestId) {
    await saveSubmissionState(key, { ...initial, status: "completed", stage: "request_not_found" });
    return { ok: false, reason: "request_not_found" };
    }

    const partnerId = await findPartnerIdByEmailAndRequest(params.email, requestId);
    if (!partnerId) {
    await saveSubmissionState(key, { ...initial, status: "completed", stage: "partner_not_matched" });
    return { ok: false, reason: "partner_not_matched" };
    }

    const communicationId = await findSentCommunicationForPartner(requestId, partnerId);

    let quoteType: "supplier" | "freight" = "supplier";
    if (communicationId) {
    const rows = await read<{ x_name: string | false }>("x_build_ai_communication", [communicationId], ["x_name"]);
    if (rows[0]?.x_name && rows[0].x_name.startsWith("Freight")) quoteType = "freight";
    }
    return await persistExtractedQuote(requestId, partnerId, communicationId, quoteType);
  }

  return await persistExtractedQuote(matched.requestId, matched.partnerId, matched.communicationId, matched.quoteType);

  async function persistExtractedQuote(requestId: number, partnerId: number, communicationId: number | null, quoteType: "supplier" | "freight"): Promise<QuoteIntakeResult> {

  if (params.attachmentOnly) {
    await postProcurementRequestNote(requestId, `وصل رد RFQ بمرفق فقط من ${params.email}. لم يمكن استخراج نص صالح بأمان؛ حُوّل للمراجعة التشغيلية. اتصال RFQ: ${communicationId ?? "غير محدد"}.`);
    await saveSubmissionState(key, { ...initial, status: "completed", stage: "attachment_review_required" });
    return { ok: false, reason: "extraction_failed" };
  }

  const extraction = await extractQuoteFromReply(params.rawText);
  if (!extraction) {
    await postProcurementRequestNote(requestId, `وصل رد RFQ من ${params.email} لكنه يحتاج مراجعة تشغيلية: لم يمكن استخراج تسعير آمن من النص/المرفق. اتصال RFQ: ${communicationId ?? "غير محدد"}.`);
    await saveSubmissionState(key, { ...initial, status: "completed", stage: "extraction_failed" });
    return { ok: false, reason: "extraction_failed" };
  }

  const quoteId = await createSupplierQuote({
    requestId,
    partnerId,
    communicationId,
    quoteType,
    rawReplyText: params.rawText,
    extraction,
  });

  // مقارنة/اختيار الفائز عند توفر عرضين محلَّلين أو أكثر — best effort، فشلها لا يكسر تسجيل العرض نفسه
  try {
    await checkAndTriggerWinnerSelection(requestId, quoteType);
  } catch (error) {
    console.error("[quote-intake] checkAndTriggerWinnerSelection failed (non-blocking):", error instanceof Error ? error.message : error);
  }

  await saveSubmissionState(key, { ...initial, status: "completed", requestId: quoteId, quoteType, stage: "quote_created" });
  return { ok: true, quoteId, quoteType, confidence: extraction.confidence };
  }
  } catch (error) {
    await saveSubmissionState(key, { ...initial, status: "failed", stage: "failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) }).catch(() => undefined);
    throw error;
  }
}
