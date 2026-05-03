import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "علامات المورد");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { vendorId, brandId } = (await req.json().catch(() => ({}))) as {
    vendorId?: string;
    brandId?: string;
  };
  if (!vendorId || !brandId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { error } = await db
    .from("vendor_brands")
    .insert({ vendor_id: vendorId, brand_id: brandId });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "علامات المورد");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { vendorId, brandId } = (await req.json().catch(() => ({}))) as {
    vendorId?: string;
    brandId?: string;
  };
  if (!vendorId || !brandId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { error } = await db
    .from("vendor_brands")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
