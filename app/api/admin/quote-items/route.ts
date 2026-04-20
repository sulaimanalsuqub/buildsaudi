import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

// GET /api/admin/quote-items?quoteId=xxx
export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "quote-items");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = createServiceRoleClient();
  const { data: items, error } = await adminSupabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

// POST /api/admin/quote-items
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "quote-items");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { quoteId, name, description, quantity, unit, category } = await req.json();
  if (!quoteId || !name || !quantity || !unit || !category) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const adminSupabase = createServiceRoleClient();
  const { data: item, error } = await adminSupabase
    .from("quote_items")
    .insert({ quote_id: quoteId, name, description: description ?? null, quantity, unit, category })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item });
}

// DELETE /api/admin/quote-items
export async function DELETE(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "quote-items");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId مطلوب" }, { status: 400 });

  const adminSupabase = createServiceRoleClient();
  const { error } = await adminSupabase.from("quote_items").delete().eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}