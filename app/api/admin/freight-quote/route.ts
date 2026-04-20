import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

// GET /api/admin/freight-quote?quoteId=xxx
export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "freight-quote");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = createServiceRoleClient();
  const { data: freightQuotes, error } = await adminSupabase
    .from("freight_quotes")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ freightQuotes });
}

// POST /api/admin/freight-quote
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "freight-quote");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { quoteId, companyName, price, currency, deliveryDays, notes } = await req.json();

  if (!quoteId || price == null) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  if (parseFloat(price) <= 0) {
    return NextResponse.json({ error: "السعر يجب أن يكون أكبر من صفر" }, { status: 400 });
  }

  const adminSupabase = createServiceRoleClient();

  const notesText = [companyName ? `شركة: ${companyName}` : null, notes ?? null]
    .filter(Boolean)
    .join("\n");

  const payload: Record<string, unknown> = {
    quote_id: quoteId,
    price: parseFloat(price),
    currency: currency ?? "SAR",
    status: "received",
  };
  if (deliveryDays) payload.delivery_days = parseInt(deliveryDays, 10);
  if (notesText) payload.notes = notesText;

  const { data: fq, error } = await adminSupabase
    .from("freight_quotes")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminSupabase.from("approvals").insert({
    entity_type: "freight_quote",
    entity_id: quoteId,
    stage: "receive_freight_quote",
    action: "approved",
    actor: auth.user?.email ?? "admin",
    notes: `عرض شحن بقيمة ${parseFloat(price)} ${currency ?? "SAR"}${companyName ? ` — ${companyName}` : ""}`,
  });

  return NextResponse.json({ ok: true, freightQuote: fq });
}