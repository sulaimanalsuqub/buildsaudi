import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { MAX_PRICE } from "@/lib/constants";

// GET /api/admin/vendor-quote?quoteId=xxx
export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "vendor-quote");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = createServiceRoleClient();

  const { data: rfqs } = await adminSupabase
    .from("rfqs")
    .select("id")
    .eq("quote_id", quoteId);

  const rfqIds = (rfqs ?? []).map((r) => r.id);
  if (rfqIds.length === 0) return NextResponse.json({ vendorQuotes: [] });

  const { data: vendorQuotes, error } = await adminSupabase
    .from("vendor_quotes")
    .select("*")
    .in("rfq_id", rfqIds)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vendorQuotes });
}

// POST /api/admin/vendor-quote
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "vendor-quote");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { rfqId, vendorId, totalPrice, deliveryDays, validityDays, notes } = await req.json();

  if (!rfqId || !vendorId || totalPrice == null) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const parsedPrice = parseFloat(totalPrice);
  if (parsedPrice <= 0 || parsedPrice > MAX_PRICE) {
    return NextResponse.json(
      { error: `السعر يجب أن يكون بين 0.01 و ${MAX_PRICE.toLocaleString("ar-SA")} ر.س` },
      { status: 400 }
    );
  }

  const adminSupabase = createServiceRoleClient();

  const { data: vq, error: vqError } = await adminSupabase
    .from("vendor_quotes")
    .upsert(
      {
        rfq_id: rfqId,
        vendor_id: vendorId,
        total_price: parsedPrice,
        delivery_days: deliveryDays ? parseInt(deliveryDays, 10) : null,
        validity_days: validityDays ? parseInt(validityDays, 10) : null,
        notes: notes ?? null,
        source: "manual",
      },
      { onConflict: "rfq_id" }
    )
    .select()
    .single();

  if (vqError) return NextResponse.json({ error: vqError.message }, { status: 500 });

  await adminSupabase.from("rfqs").update({ status: "received" }).eq("id", rfqId);

  await adminSupabase.from("approvals").insert({
    entity_type: "vendor_quote",
    entity_id: rfqId,
    stage: "receive_vendor_quote",
    action: "approved",
    actor: auth.user?.email ?? "admin",
    notes: `عرض مورد بقيمة ${parsedPrice} — RFQ: ${rfqId.slice(0, 8)}`,
  });

  return NextResponse.json({ ok: true, vendorQuote: vq });
}