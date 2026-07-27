import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processQuoteReply } from "@/lib/quote-intake";

// نقطة استقبال داخلية فقط (لا واجهة عامة) — تُستدعى يدوياً من فريق العمليات
// لتسجيل رد مورد/ناقل على RFQ كعرض سعر منظَّم في Odoo. القناة التلقائية: /api/rfq/inbound-email (Resend Inbound webhook).
const bodySchema = z.object({
  trackingNumber: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  rawText: z.string().trim().min(5),
});

const ERROR_MESSAGES: Record<string, string> = {
  request_not_found: "لا يوجد طلب بهذا الرقم",
  partner_not_matched: "هذا البريد ليس من ضمن الموردين/الناقلين المرسَل لهم RFQ لهذا الطلب",
  extraction_failed: "تعذر استخلاص بيانات العرض من النص (تحقق من DEEPSEEK_API_KEY أو وضوح النص)",
};

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

  const result = await processQuoteReply(parsed.data);
  if (!result.ok) {
    const status = result.reason === "extraction_failed" ? 422 : 404;
    return NextResponse.json({ error: ERROR_MESSAGES[result.reason] }, { status });
  }

  return NextResponse.json({ ok: true, quoteId: result.quoteId, quoteType: result.quoteType, confidence: result.confidence });
}
