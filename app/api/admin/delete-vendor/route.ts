import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "حذف مورد");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const { vendorId } = await req.json();
    if (!vendorId) return NextResponse.json({ error: "معرّف المورد مطلوب" }, { status: 400 });

    const adminSupabase = createServiceRoleClient();

    const { data: vendor } = await adminSupabase
      .from("vendors")
      .select("establishment_name, status")
      .eq("id", vendorId)
      .single();

    if (!vendor) return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });

    // تسجيل في سجل الموافقات قبل الحذف
    await adminSupabase.from("approvals").insert({
      entity_type: "vendor",
      entity_id: vendorId,
      stage: "delete_vendor",
      action: "approved",
      actor: auth.user?.email ?? "admin",
      notes: `تم حذف المورد "${vendor.establishment_name}" (حالة: ${vendor.status})`,
    });

    const { error } = await adminSupabase.from("vendors").delete().eq("id", vendorId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}