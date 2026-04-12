import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { token, action } = await req.json();
    // action: 'accepted' | 'rejected'

    if (!token || !["accepted", "rejected"].includes(action)) {
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

    // Update offer status
    await adminSupabase
      .from("client_offers")
      .update({ status: action, client_response_at: new Date().toISOString() })
      .eq("id", offer.id);

    // التحقق من حالة الطلب قبل التحديث
    const { data: currentQuote } = await adminSupabase
      .from("quotes")
      .select("status")
      .eq("id", offer.quote_id)
      .single();

    if (!currentQuote || currentQuote.status !== "offer_sent") {
      return NextResponse.json(
        { error: "لا يمكن الرد — حالة الطلب غير متوافقة" },
        { status: 409 }
      );
    }

    // Update quote status
    const nextQuoteStatus = action === "accepted" ? "client_approved" : "cancelled";
    await adminSupabase
      .from("quotes")
      .update({ status: nextQuoteStatus })
      .eq("id", offer.quote_id);

    // تسجيل رد العميل في سجل الموافقات
    await adminSupabase.from("approvals").insert({
      entity_type: "client_offer",
      entity_id: offer.quote_id,
      stage: "client_response",
      action: action === "accepted" ? "approved" : "rejected",
      actor: "client",
      notes: action === "accepted" ? "العميل وافق على العرض" : "العميل رفض العرض",
    });

    return NextResponse.json({ ok: true, action });
  } catch (e) {
    console.error("offer/respond error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
