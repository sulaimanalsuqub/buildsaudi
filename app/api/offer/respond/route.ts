import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendClientResponseNotification } from "@/lib/email";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const { ok, resetAt } = checkRateLimit(clientId, "forms");
    if (!ok) return rateLimitError(resetAt, "رد على عروض");

    const { token, action, reason } = await req.json();
    // action: 'accepted' | 'rejected' | 'modification_requested'

    if (!token || !["accepted", "rejected", "modification_requested"].includes(action)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Find offer by token
    const { data: offer, error: fetchError } = await adminSupabase
      .from("client_offers")
      .select("id, quote_id, status, expires_at")
      .eq("offer_token", token)
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({ error: "العرض غير موجود" }, { status: 404 });
    }

    if (offer.status !== "sent") {
      return NextResponse.json({ error: "تم الرد على هذا العرض مسبقاً" }, { status: 409 });
    }

    // Check expiry
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      await adminSupabase
        .from("client_offers")
        .update({ status: "expired" })
        .eq("id", offer.id);
      return NextResponse.json({ error: "انتهت صلاحية العرض" }, { status: 410 });
    }

    // التحقق من حالة الطلب قبل التحديث
    const { data: currentQuote } = await adminSupabase
      .from("quotes")
      .select("status, project_name, client_name")
      .eq("id", offer.quote_id)
      .single();

    if (!currentQuote || currentQuote.status !== "offer_sent") {
      return NextResponse.json(
        { error: "لا يمكن الرد — حالة الطلب غير متوافقة" },
        { status: 409 }
      );
    }

    // Update offer status only after the parent quote is valid
    const offerStatus = action === "modification_requested" ? "sent" : action;
    const updateData: Record<string, string> = { status: offerStatus };
    if (action !== "modification_requested") {
      updateData.client_response_at = new Date().toISOString();
    }
    await adminSupabase
      .from("client_offers")
      .update(updateData)
      .eq("id", offer.id);

    // Update quote status (only for accept/reject, not modification requests)
    if (action !== "modification_requested") {
      const nextQuoteStatus = action === "accepted" ? "client_approved" : "cancelled";
      await adminSupabase
        .from("quotes")
        .update({ status: nextQuoteStatus })
        .eq("id", offer.quote_id);
    }

    // تسجيل رد العميل في سجل الموافقات
    const notesMap: Record<string, string> = {
      accepted: "العميل وافق على العرض",
      rejected: reason ? `العميل رفض العرض — السبب: ${reason}` : "العميل رفض العرض",
      modification_requested: `العميل طلب تعديل — ${reason || "بدون تفاصيل"}`,
    };
    await adminSupabase.from("approvals").insert({
      entity_type: "client_offer",
      entity_id: offer.quote_id,
      stage: "client_response",
      action: action === "accepted" ? "approved" : action === "rejected" ? "rejected" : "modification_requested",
      actor: "client",
      notes: notesMap[action],
    });

    // إشعار الأدمن برد العميل
    try {
      await sendClientResponseNotification({
        project_name: currentQuote.project_name,
        client_name: currentQuote.client_name,
        action,
        reason: reason || undefined,
        quote_id: offer.quote_id,
      });
    } catch (e) {
      console.error("Admin notification email failed:", e);
    }

    return NextResponse.json({ ok: true, action });
  } catch (e) {
    console.error("offer/respond error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
