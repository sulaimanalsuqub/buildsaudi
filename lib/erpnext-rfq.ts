import { createHash, createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { createDoc, getDoc, addComment, ErpnextClientError, erpnextCompany } from "./erpnext.ts";
import { extractQuoteFromReply, type ExtractedQuote } from "./quote-extraction.ts";
import { claimSubmission, saveSubmissionState } from "./shared-store.ts";
import type { QuoteIntakeResult } from "./quote-intake.ts";

/**
 * PHASE 4 — RFQ (native Request for Quotation) + Supplier Quotation on ERPNext.
 * No supplier portal (spec §17): the outbound RFQ email is delivered by buildsaudi + Resend and
 * carries a signed correlation token [RFQID:<token>] in the subject that maps the inbound reply
 * back to (RFQ, Supplier). Replies become DRAFT Supplier Quotations — never auto-submitted (spec §19).
 */

// ─────────────────────────────────────────────────────────────
// Correlation token  (RFQ, Supplier)  ⇄  [RFQID:<token>]
// token is base64url(payload|hmac) → matches the inbound regex [A-Za-z0-9_-]{32,}
// ─────────────────────────────────────────────────────────────

function correlationSecret(): string {
  // سر مستقل إن وُجد، وإلا سر ERPNext (متوفّر دائماً في وضع ERPNext) — للتكامل/منع التزوير
  return process.env.RFQ_CORRELATION_SECRET || process.env.ERPNEXT_API_SECRET || "";
}

function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function buildRfqCorrelation(rfqName: string, supplier: string): string {
  const payload = `${rfqName}|${supplier}`;
  const sig = createHmac("sha256", correlationSecret()).update(payload).digest("hex");
  return b64urlEncode(`${payload}|${sig}`);
}

export function resolveRfqCorrelation(token: string): { rfqName: string; supplier: string } | null {
  let decoded: string;
  try {
    decoded = b64urlDecode(token);
  } catch {
    return null;
  }
  const parts = decoded.split("|");
  if (parts.length !== 3) return null;
  const [rfqName, supplier, sig] = parts;
  const expected = createHmac("sha256", correlationSecret()).update(`${rfqName}|${supplier}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { rfqName, supplier };
}

/** صف الموضوع القياسي لرسالة RFQ الصادرة (يحافظ على نمط correlation القائم) */
export function rfqEmailSubject(rfqName: string, supplier: string, projectOrTender?: string): string {
  const token = buildRfqCorrelation(rfqName, supplier);
  const label = projectOrTender ? ` — ${projectOrTender}` : "";
  return `[${rfqName}][RFQID:${token}] Build Request for Quotation${label}`;
}

// ─────────────────────────────────────────────────────────────
// RFQ types
// ─────────────────────────────────────────────────────────────

type RfqItem = {
  name: string; // child row id → request_for_quotation_item
  item_code: string;
  item_name?: string;
  qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
};
type RfqDoc = {
  name: string;
  company: string;
  items: RfqItem[];
  suppliers: { supplier: string }[];
};

// ─────────────────────────────────────────────────────────────
// Outbound dispatch: collect (supplier, email, correlation, lines) from an RFQ
// (pure ERPNext read — the route does the actual Resend send; no supplier portal)
// ─────────────────────────────────────────────────────────────

export type RfqDispatchLine = { itemName: string; quantity: number; unit: string; brand: string; countryOfOrigin: string };
export type RfqRecipient = { supplier: string; email: string | null; correlation: string; lines: RfqDispatchLine[] };
export type RfqDispatch = { rfqName: string; projectName: string; description: string; recipients: RfqRecipient[] };

async function supplierEmail(supplier: string, cid: string): Promise<string | null> {
  const s = await getDoc<{ email_id?: string; supplier_primary_contact?: string }>("Supplier", supplier, cid);
  if (s.email_id) return s.email_id;
  if (s.supplier_primary_contact) {
    const c = await getDoc<{ email_id?: string }>("Contact", s.supplier_primary_contact, cid);
    return c.email_id || null;
  }
  return null;
}

export async function buildRfqDispatch(rfqName: string, cid: string): Promise<RfqDispatch> {
  const rfq = await getDoc<RfqDoc & { subject?: string; message_for_supplier?: string }>("Request for Quotation", rfqName, cid);
  const lines: RfqDispatchLine[] = (rfq.items || []).map((it) => ({
    itemName: it.item_name || it.item_code,
    quantity: it.qty,
    unit: it.uom,
    brand: "",
    countryOfOrigin: "",
  }));
  const recipients: RfqRecipient[] = [];
  for (const s of rfq.suppliers || []) {
    recipients.push({
      supplier: s.supplier,
      email: await supplierEmail(s.supplier, cid),
      correlation: buildRfqCorrelation(rfqName, s.supplier),
      lines,
    });
  }
  return {
    rfqName,
    projectName: rfq.subject || rfqName,
    description: rfq.message_for_supplier || "",
    recipients,
  };
}

// ─────────────────────────────────────────────────────────────
// Draft Supplier Quotation from a parsed reply (never submitted)
// ─────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

/** يطابق سطر الاستخلاص بالصنف في RFQ (تطابق اسم تقريبي)، وإلا يطبّق السعر الإجمالي على البند الوحيد */
function rateForItem(item: RfqItem, extraction: ExtractedQuote): number {
  const target = norm(item.item_name || item.item_code);
  const line = extraction.lines.find((l) => {
    const n = norm(l.itemName);
    return n === target || n.includes(target) || target.includes(n);
  });
  if (line?.unitPrice != null) return line.unitPrice;
  // بند وحيد وسعر إجمالي فقط → وزّعه كسعر وحدة
  if (extraction.lines.length === 0 && extraction.totalPrice != null && item.qty > 0) {
    return extraction.totalPrice / item.qty;
  }
  return 0; // غير معروف — يراجعه الموظف قبل Submit
}

export async function createDraftSupplierQuotationFromReply(params: {
  rfqName: string;
  supplier: string;
  extraction: ExtractedQuote;
  rawText: string;
  correlationId: string;
}): Promise<string> {
  const { rfqName, supplier, extraction, correlationId } = params;
  const rfq = await getDoc<RfqDoc>("Request for Quotation", rfqName, correlationId);

  const today = new Date().toISOString().slice(0, 10);
  const validTill =
    extraction.validityDays && extraction.validityDays > 0
      ? new Date(Date.now() + extraction.validityDays * 86400_000).toISOString().slice(0, 10)
      : undefined;

  const items = rfq.items.map((it) => {
    const rate = rateForItem(it, extraction);
    return {
      item_code: it.item_code,
      qty: it.qty,
      uom: it.uom,
      stock_uom: it.stock_uom,
      conversion_factor: it.conversion_factor || 1,
      rate,
      request_for_quotation: rfqName,
      request_for_quotation_item: it.name,
    };
  });

  const sq = await createDoc<{ name: string }>(
    "Supplier Quotation",
    {
      supplier,
      company: rfq.company || erpnextCompany(),
      transaction_date: today,
      ...(validTill ? { valid_till: validTill } : {}),
      currency: "SAR",
      conversion_rate: 1,
      items,
      // يبقى Draft — الموظف يراجع ثم Submit (spec §19)
    },
    correlationId
  );

  // سياق الرد الأصلي + ملخص الاستخلاص كتعليق أصلي للمراجعة
  const summary = [
    `RFQ: ${rfqName}`,
    `Extraction confidence: ${extraction.confidence}`,
    extraction.totalPrice != null ? `Stated total: ${extraction.totalPrice} ${extraction.currency || ""}` : null,
    extraction.leadTimeDays != null ? `Lead time (days): ${extraction.leadTimeDays}` : null,
    extraction.paymentTerms ? `Payment terms: ${extraction.paymentTerms}` : null,
    extraction.includesTax != null ? `Includes tax: ${extraction.includesTax}` : null,
    extraction.includesDelivery != null ? `Includes delivery: ${extraction.includesDelivery}` : null,
    "",
    "--- Supplier reply (raw) ---",
    params.rawText.slice(0, 4000),
  ]
    .filter((l) => l !== null)
    .join("\n");
  await addComment("Supplier Quotation", sq.name, summary, correlationId).catch(() => {});

  return sq.name;
}

async function addRfqNote(rfqName: string, note: string, cid: string): Promise<void> {
  await addComment("Request for Quotation", rfqName, note, cid).catch(() => {});
}

// ─────────────────────────────────────────────────────────────
// Inbound reply processor (ERPNext variant of processQuoteReply)
// ─────────────────────────────────────────────────────────────

export async function processQuoteReplyErpnext(params: {
  trackingNumber: string;
  email: string;
  rawText: string;
  correlation?: string;
  attachmentOnly?: boolean;
  attachmentReference?: string;
  idempotencyKey?: string;
}): Promise<QuoteIntakeResult> {
  const contentHash = createHash("sha256").update(`${params.correlation || params.trackingNumber}\n${params.email}\n${params.rawText}`).digest("hex");
  const quoteIdentity = `${params.correlation || params.trackingNumber}:${contentHash}`;
  const key = `erpnext-quote-intake:${quoteIdentity}`;
  const initial = { status: "processing" as const, operation: "quote" as const, submissionId: quoteIdentity, correlationId: randomUUID(), stage: "received" };
  const claim = await claimSubmission(key, initial);
  if (!claim.claimed) {
    if (claim.state.status === "completed" && claim.state.trackingNumber) {
      return { ok: true, quoteId: claim.state.trackingNumber, quoteType: "supplier", confidence: 1 };
    }
    throw new Error(`Quote intake is ${claim.state.status}; retry after its lease window`);
  }

  try {
    // correlation هو الرابط الموثوق الوحيد (لا تخمين بالمرسِل) — spec §18
    const resolved = params.correlation ? resolveRfqCorrelation(params.correlation) : null;
    if (!resolved) {
      await saveSubmissionState(key, { ...initial, status: "completed", stage: "partner_not_matched" });
      return { ok: false, reason: "partner_not_matched" };
    }

    // تحقّق أن RFQ موجود والمورد ضمن مورديه
    let rfq: RfqDoc;
    try {
      rfq = await getDoc<RfqDoc>("Request for Quotation", resolved.rfqName, initial.correlationId);
    } catch (error) {
      if (error instanceof ErpnextClientError && error.kind === "not_found") {
        await saveSubmissionState(key, { ...initial, status: "completed", stage: "request_not_found" });
        return { ok: false, reason: "request_not_found" };
      }
      throw error;
    }
    if (!rfq.suppliers?.some((s) => s.supplier === resolved.supplier)) {
      await saveSubmissionState(key, { ...initial, status: "completed", stage: "partner_not_matched" });
      return { ok: false, reason: "partner_not_matched" };
    }

    if (params.attachmentOnly) {
      await addRfqNote(
        resolved.rfqName,
        `وصل رد RFQ بمرفق فقط من ${params.email} (المورد ${resolved.supplier}). تعذّر استخراج نص؛ يحتاج مراجعة تشغيلية. مرجع البريد: ${params.attachmentReference ?? "غير متاح"}. حدث: ${params.idempotencyKey ?? "غير متاح"}.`,
        initial.correlationId
      );
      await saveSubmissionState(key, { ...initial, status: "completed", stage: "attachment_review_required" });
      return { ok: false, reason: "attachment_review_required" };
    }

    const extraction = await extractQuoteFromReply(params.rawText);
    if (!extraction) {
      await addRfqNote(
        resolved.rfqName,
        `وصل رد RFQ من ${params.email} (المورد ${resolved.supplier}) لكن تعذّر استخلاص تسعير آمن؛ يحتاج مراجعة تشغيلية.`,
        initial.correlationId
      );
      await saveSubmissionState(key, { ...initial, status: "completed", stage: "extraction_failed" });
      return { ok: false, reason: "extraction_failed" };
    }

    const sqName = await createDraftSupplierQuotationFromReply({
      rfqName: resolved.rfqName,
      supplier: resolved.supplier,
      extraction,
      rawText: params.rawText,
      correlationId: initial.correlationId,
    });

    await saveSubmissionState(key, { ...initial, status: "completed", trackingNumber: sqName, quoteType: "supplier", stage: "quote_created" });
    return { ok: true, quoteId: sqName, quoteType: "supplier", confidence: extraction.confidence };
  } catch (error) {
    await saveSubmissionState(key, { ...initial, status: "failed", stage: "failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) }).catch(() => undefined);
    throw error;
  }
}
