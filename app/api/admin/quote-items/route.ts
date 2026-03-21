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
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/quote-items?quoteId=xxx
export async function GET(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = getAdminClient();
  const { data: items, error } = await adminSupabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

// POST /api/admin/quote-items — إضافة صنف جديد
export async function POST(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { quoteId, name, description, quantity, unit, category } = await req.json();
  if (!quoteId || !name || !quantity || !unit || !category) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const adminSupabase = getAdminClient();
  const { data: item, error } = await adminSupabase
    .from("quote_items")
    .insert({ quote_id: quoteId, name, description: description ?? null, quantity, unit, category })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item });
}

// DELETE /api/admin/quote-items — حذف صنف
export async function DELETE(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId مطلوب" }, { status: 400 });

  const adminSupabase = getAdminClient();
  const { error } = await adminSupabase.from("quote_items").delete().eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
