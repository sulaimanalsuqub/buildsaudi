import {
  checkAndTriggerWinnerSelection,
  createSupplierQuote,
  findPartnerIdByEmailAndRequest,
  findRequestIdByTrackingNumber,
  findSentCommunicationForPartner,
  read,
} from "@/lib/odoo";
import { extractQuoteFromReply } from "@/lib/quote-extraction";

export type QuoteIntakeResult =
  | { ok: true; quoteId: number; quoteType: "supplier" | "freight"; confidence: number }
  | { ok: false; reason: "request_not_found" | "partner_not_matched" | "extraction_failed" };

/** يعالج رد مورد/ناقل على RFQ (نصاً حراً) ويحوّله لعرض سعر منظَّم في Odoo — تُستخدم من نقطة الاستقبال اليدوية ومن قارئ البريد الوارد معاً */
export async function processQuoteReply(params: { trackingNumber: string; email: string; rawText: string }): Promise<QuoteIntakeResult> {
  const requestId = await findRequestIdByTrackingNumber(params.trackingNumber);
  if (!requestId) return { ok: false, reason: "request_not_found" };

  const partnerId = await findPartnerIdByEmailAndRequest(params.email, requestId);
  if (!partnerId) return { ok: false, reason: "partner_not_matched" };

  const communicationId = await findSentCommunicationForPartner(requestId, partnerId);

  let quoteType: "supplier" | "freight" = "supplier";
  if (communicationId) {
    const rows = await read<{ x_name: string | false }>("x_build_ai_communication", [communicationId], ["x_name"]);
    if (rows[0]?.x_name && rows[0].x_name.startsWith("Freight")) quoteType = "freight";
  }

  const extraction = await extractQuoteFromReply(params.rawText);
  if (!extraction) return { ok: false, reason: "extraction_failed" };

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

  return { ok: true, quoteId, quoteType, confidence: extraction.confidence };
}
