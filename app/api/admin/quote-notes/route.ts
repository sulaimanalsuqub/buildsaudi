import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function PATCH(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "ملاحظات الطلب");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { quoteId, notes } = (await req.json().catch(() => ({}))) as {
    quoteId?: string;
    notes?: string;
  };
  if (!quoteId) return NextResponse.json({ error: "معرّف الطلب مطلوب" }, { status: 400 });

  const db = createServiceRoleClient();
  const { error } = await db
    .from("quotes")
    .update({ admin_notes: notes?.trim() || null })
    .eq("id", quoteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
