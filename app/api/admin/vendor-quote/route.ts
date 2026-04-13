import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const getAdminClient = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function authCheck() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/vendor-quote?quoteId=xxx
export async function GET(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = getAdminClient();

  // الحصول على rfq_ids أولاً ثم vendor_quotes
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

// POST /api/admin/vendor-quote — إدخال/تحديث عرض مورد
export async function POST(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { rfqId, vendorId, totalPrice, deliveryDays, validityDays, notes } = await req.json();

  if (!rfqId || !vendorId || totalPrice == null) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  if (parseFloat(totalPrice) <= 0) {
    return NextResponse.json({ error: "السعر يجب أن يكون أكبر من صفر" }, { status: 400 });
  }

  const adminSupabase = getAdminClient();

  // Upsert: واحد لكل rfq
  const { data: vq, error: vqError } = await adminSupabase
    .from("vendor_quotes")
    .upsert(
      {
        rfq_id: rfqId,
        vendor_id: vendorId,
        total_price: parseFloat(totalPrice),
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

  // تحديث حالة الـ RFQ إلى received
  await adminSupabase.from("rfqs").update({ status: "received" }).eq("id", rfqId);

  // تسجيل في سجل الموافقات
  await adminSupabase.from("approvals").insert({
    entity_type: "vendor_quote",
    entity_id: rfqId,
    stage: "receive_vendor_quote",
    action: "approved",
    actor: user?.email ?? "admin",
    notes: `عرض مورد بقيمة ${parseFloat(totalPrice)} — RFQ: ${rfqId.slice(0, 8)}`,
  });

  return NextResponse.json({ ok: true, vendorQuote: vq });
}
