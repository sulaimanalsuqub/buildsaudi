import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

// POST /api/admin/brands — إضافة علامة تجارية
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "brands");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "اسم العلامة مطلوب" }, { status: 400 });

  const db = createServiceRoleClient();
  const { data, error } = await db.from("brands").insert({ name: name.trim() }).select().single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "هذه العلامة مسجّلة مسبقاً" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, brand: data });
}

// DELETE /api/admin/brands
export async function DELETE(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "brands");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "معرّف العلامة مطلوب" }, { status: 400 });

  const db = createServiceRoleClient();
  const { error } = await db.from("brands").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}