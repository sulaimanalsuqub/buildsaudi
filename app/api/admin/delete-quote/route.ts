import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "حذف طلب");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const { quoteId } = await req.json();
    if (!quoteId) return NextResponse.json({ error: "معرّف الطلب مطلوب" }, { status: 400 });

    const adminSupabase = createServiceRoleClient();

    const { data: quote } = await adminSupabase
      .from("quotes")
      .select("status")
      .eq("id", quoteId)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const protectedStatuses = ["client_approved", "payment_pending", "payment_confirmed", "in_delivery", "done"];
    if (protectedStatuses.includes(quote.status)) {
      return NextResponse.json(
        { error: `لا يمكن حذف طلب في حالة "${quote.status}" — يمكنك إلغاؤه بدلاً من حذفه` },
        { status: 409 }
      );
    }

    await adminSupabase.from("approvals").insert({
      entity_type: "quote",
      entity_id: quoteId,
      stage: "delete_quote",
      action: "approved",
      actor: auth.user?.email ?? "admin",
      notes: `تم حذف طلب في حالة "${quote.status}"`,
    });

    const { error } = await adminSupabase.from("quotes").delete().eq("id", quoteId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}