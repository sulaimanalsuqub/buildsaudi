import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
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

  const quoteId = crypto.randomUUID();
  const quote = parsed.data;
  const db = createServiceRoleClient();

  const { error } = await db.from("quotes").insert({
    id: quoteId,
    project_name: quote.project_name,
    client_name: quote.client_name,
    phone: quote.phone,
    client_email: quote.client_email || null,
    materials: quote.materials,
    sheet_link: quote.sheet_link || null,
    delivery_address: quote.delivery_address,
    delivery_date: quote.delivery_date,
    notes: quote.notes || null,
    boq_file_url: quote.boq_file_url || null,
  });

  if (error) return NextResponse.json({ error: "تعذر حفظ طلب التسعير" }, { status: 500 });

  try {
    await sendNewQuoteNotification({
      id: quoteId,
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

  return NextResponse.json({ ok: true, id: quoteId });
}
