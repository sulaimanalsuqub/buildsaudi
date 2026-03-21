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

// GET /api/admin/freight-quote?quoteId=xxx
export async function GET(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = getAdminClient();
  const { data: freightQuotes, error } = await adminSupabase
    .from("freight_quotes")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ freightQuotes });
}

// POST /api/admin/freight-quote — إضافة عرض شحن
export async function POST(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { quoteId, companyName, price, currency, deliveryDays, notes } = await req.json();

  if (!quoteId || price == null) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const adminSupabase = getAdminClient();

  // نبني الـ payload ديناميكياً — companyName يُدمج في notes
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
  return NextResponse.json({ ok: true, freightQuote: fq });
}
