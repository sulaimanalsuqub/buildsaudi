import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupplierQuote,
  findPartnerIdByEmailAndRequest,
  findRequestIdByTrackingNumber,
  findSentCommunicationForPartner,
  read,
} from "@/lib/odoo";
import { extractQuoteFromReply } from "@/lib/quote-extraction";

// نقطة استقبال داخلية فقط (لا واجهة عامة) — تُستدعى يدوياً من فريق العمليات الآن (بلا IMAP بعد)،
// لتسجيل رد مورد/ناقل على RFQ كعرض سعر منظَّم في Odoo. لاحقاً يمكن ربطها بأتمتة بريد وارد فعلية.
const bodySchema = z.object({
  trackingNumber: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  rawText: z.string().trim().min(5),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" }, { status: 400 });
  }
  const { trackingNumber, email, rawText } = parsed.data;

  const requestId = await findRequestIdByTrackingNumber(trackingNumber);
  if (!requestId) {
    return NextResponse.json({ error: "لا يوجد طلب بهذا الرقم" }, { status: 404 });
  }

  const partnerId = await findPartnerIdByEmailAndRequest(email, requestId);
  if (!partnerId) {
    return NextResponse.json({ error: "هذا البريد ليس من ضمن الموردين/الناقلين المرسَل لهم RFQ لهذا الطلب" }, { status: 404 });
  }

  const communicationId = await findSentCommunicationForPartner(requestId, partnerId);

  let quoteType: "supplier" | "freight" = "supplier";
  if (communicationId) {
    const rows = await read<{ x_name: string | false }>("x_build_ai_communication", [communicationId], ["x_name"]);
    if (rows[0]?.x_name && rows[0].x_name.startsWith("Freight")) quoteType = "freight";
  }

  const extraction = await extractQuoteFromReply(rawText);
  if (!extraction) {
    return NextResponse.json({ error: "تعذر استخلاص بيانات العرض من النص (تحقق من DEEPSEEK_API_KEY أو وضوح النص)" }, { status: 422 });
  }

  const quoteId = await createSupplierQuote({
    requestId,
    partnerId,
    communicationId,
    quoteType,
    rawReplyText: rawText,
    extraction,
  });

  return NextResponse.json({ ok: true, quoteId, quoteType, confidence: extraction.confidence });
}
