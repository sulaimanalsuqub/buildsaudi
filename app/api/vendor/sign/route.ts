import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "توقيع العقود");

  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token || !UUID_RE.test(token)) {
    return NextResponse.json({ error: "رابط التوقيع غير صحيح" }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data: signature, error } = await db
    .from("vendor_contract_signatures")
    .update({
      signed_at: new Date().toISOString(),
      ip_address: clientId,
    })
    .eq("token", token)
    .is("signed_at", null)
    .select("id")
    .single();

  if (error || !signature) {
    return NextResponse.json(
      { error: "رابط التوقيع غير موجود أو تم توقيعه مسبقاً" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
