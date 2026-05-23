import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createERPNextProductOpportunity } from "@/lib/erpnext";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendNewQuoteNotification, sendQuoteConfirmationToClient } from "@/lib/email";

const quoteSchema = z.object({
  project_name: z.string().trim().min(2),
  client_name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  client_email: z.string().trim().email().optional().or(z.literal("")),
  materials: z.string().trim().min(2),
  sheet_link: z.string().trim().url().optional().or(z.literal("")),
  delivery_address: z.string().trim().min(2),
  delivery_date: z.string().trim().min(1),
  notes: z.string().trim().optional().or(z.literal("")),
  boq_file_url: z.string().trim().url().optional().or(z.literal("")),
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
    opportunity = await createERPNextProductOpportunity(quote);
  } catch (error) {
    console.error("ERPNext opportunity creation failed:", error);
    return NextResponse.json({ error: "تعذر حفظ طلب المنتجات في نظام العمليات" }, { status: 500 });
  }

  try {
    await sendNewQuoteNotification({
      id: opportunity.name,
      project_name: quote.project_name,
      client_name: quote.client_name,
      phone: quote.phone,
      delivery_address: quote.delivery_address,
      materials: quote.materials,
    });
    if (quote.client_email) {
      await sendQuoteConfirmationToClient({
        project_name: quote.project_name,
        client_name: quote.client_name,
        client_email: quote.client_email,
      });
    }
  } catch (emailError) {
    console.error("Quote notification failed:", emailError);
  }

  return NextResponse.json({ ok: true, id: opportunity.name });
}
