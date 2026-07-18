import { NextRequest, NextResponse } from "next/server";
import { OdooClientError, getProcurementRequestByTrackingToken } from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "api");
  if (!ok) return rateLimitError(resetAt, "تتبع الطلب");

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "رمز التتبع مطلوب" }, { status: 400 });
  }

  try {
    const view = await getProcurementRequestByTrackingToken(token);
    if (!view) {
      return NextResponse.json({ error: "رقم التتبع غير صحيح" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...view });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[quotes/track][${error.correlationId}] ${error.kind}: ${error.message}`);
      return NextResponse.json({ error: "تعذر الوصول لبيانات الطلب حالياً" }, { status: 500 });
    }
    console.error("Procurement request tracking lookup failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر الوصول لبيانات الطلب حالياً" }, { status: 500 });
  }
}
