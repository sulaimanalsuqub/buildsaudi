import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { createERPNextProductOpportunity, resolveOrCreateLead } from "@/lib/erpnext";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
// ملاحظة: process-quote-background يجرّ file-text → pdf-parse/xlsx — لا نستورده ثابتاً
// حتى لا تفشل وحدة المسار عند التحميل على Vercel (نفس عطل vendor complete).

const optionalText = z.preprocess(
  (value) => (value === null ? "" : value),
  z.string().trim().optional().or(z.literal(""))
);

const optionalEmail = z.preprocess(
  (value) => (value === null ? "" : value),
  z.string().trim().email().optional().or(z.literal(""))
);

const quoteSchema = z.object({
  project_name: z.string().trim().min(2),
  client_name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  client_email: optionalEmail,
  contact_method: z.enum(["email", "whatsapp"]).default("whatsapp"),
  materials: optionalText,
  delivery_address: z.string().trim().min(2),
  delivery_date: optionalText,
  notes: optionalText,
  boq_file_url: optionalText,
  boq_file_name: optionalText,
  boq_attach_token: optionalText,
  boq_file_text: optionalText,
}).refine((data) => Boolean(data.materials || data.boq_file_url || data.boq_file_text), {
  path: ["materials"],
  message: "Materials or quantity file is required",
});

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "طلبات تسعير");

  const parsed = quoteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الطلب غير مكتملة أو غير صحيحة" }, { status: 400 });
  }

  const quote = parsed.data;

  let opportunity: { name: string };
  try {
    const resolvedLead = await resolveOrCreateLead({
      client_name: quote.client_name,
      phone: quote.phone,
      client_email: quote.client_email,
    });

    opportunity = await createERPNextProductOpportunity({
      ...quote,
      extracted_items: [],
      resolved_lead: resolvedLead,
    });
  } catch (error) {
    console.error("ERPNext opportunity creation failed:", error);
    return NextResponse.json({ error: "تعذر حفظ طلب المنتجات في نظام العمليات" }, { status: 500 });
  }

  const backgroundInput = {
    opportunityName: opportunity.name,
    project_name: quote.project_name,
    client_name: quote.client_name,
    phone: quote.phone,
    client_email: quote.client_email,
    delivery_address: quote.delivery_address,
    materials: quote.materials,
    notes: quote.notes,
    boq_file_url: quote.boq_file_url,
    boq_file_name: quote.boq_file_name,
    boq_attach_token: quote.boq_attach_token,
    boq_file_text: quote.boq_file_text,
  };

  after(async () => {
    try {
      // استيراد ديناميكي: pdf-parse/xlsx تُحمَّل وقت التنفيذ فقط داخل الخلفية
      const { processQuoteBackground } = await import("@/lib/process-quote-background");
      await processQuoteBackground(backgroundInput);
    } catch (error) {
      console.error("Quote background processing failed:", error);
    }
  });

  return NextResponse.json({ ok: true, id: opportunity.name });
}