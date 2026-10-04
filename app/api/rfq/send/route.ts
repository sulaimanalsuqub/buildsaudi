import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { isErpnextConfigured, ErpnextClientError } from "@/lib/erpnext";
import { buildRfqDispatch } from "@/lib/erpnext-rfq";
import { sendSupplierRfqRequestEmail } from "@/lib/email";

export const maxDuration = 60;

// إرسال RFQ (من ERPNext) للموردين عبر Resend — بلا Supplier Portal.
// نقطة داخلية: تُستدعى من ERPNext (زر/Webhook) أو يدوياً من الفريق، محميّة بسرّ خدمة.
// الموضوع يحمل [RFQID:<token>] المربوط بـ(RFQ + Supplier)؛ ردود الموردين تُنشئ Draft Supplier Quotation فقط.

const schema = z.object({
  rfqName: z.string().trim().min(1),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const expected = process.env.RFQ_SEND_SECRET || process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!expected || req.headers.get("x-service-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isErpnextConfigured()) {
    return NextResponse.json({ error: "ERPNext is not configured" }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "rfqName required" }, { status: 400 });
  }
  const { rfqName, dryRun } = parsed.data;
  const cid = randomUUID();

  let dispatch;
  try {
    dispatch = await buildRfqDispatch(rfqName, cid);
  } catch (error) {
    if (error instanceof ErpnextClientError && error.kind === "not_found") {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }
    const msg = error instanceof ErpnextClientError ? error.publicMessage : "تعذّر قراءة RFQ من نظام العمليات";
    const status = error instanceof ErpnextClientError && error.retryable ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }

  const results: { supplier: string; email: string | null; sent: boolean; skipped?: string }[] = [];
  for (const r of dispatch.recipients) {
    if (!r.email) {
      results.push({ supplier: r.supplier, email: null, sent: false, skipped: "no_email" });
      continue;
    }
    if (dryRun) {
      results.push({ supplier: r.supplier, email: r.email, sent: false, skipped: "dry_run" });
      continue;
    }
    try {
      await sendSupplierRfqRequestEmail({
        supplierName: r.supplier,
        email: r.email,
        projectName: dispatch.projectName,
        trackingNumber: rfqName,
        correlation: r.correlation,
        description: dispatch.description,
        lines: r.lines,
      });
      results.push({ supplier: r.supplier, email: r.email, sent: true });
    } catch (error) {
      console.error(`[rfq/send] ${cid} failed for ${r.supplier}:`, error instanceof Error ? error.message : error);
      results.push({ supplier: r.supplier, email: r.email, sent: false, skipped: "send_error" });
    }
  }

  return NextResponse.json({
    ok: true,
    rfq: rfqName,
    dryRun,
    recipients: results.length,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
