import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendClientOfferEmail } from "@/lib/email";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { checkAdminAuth, authError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "إرسال عروض");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const {
      quoteId, clientName, clientEmail, projectName,
      deliveryAddress, deliveryDate, materialsTotal,
      freightTotal, platformFee, grandTotal, validityDays,
    } = await req.json();

    if (!quoteId || !clientEmail || !materialsTotal || !freightTotal) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    if (materialsTotal <= 0 || freightTotal <= 0) {
      return NextResponse.json({ error: "الأسعار يجب أن تكون أكبر من صفر" }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    const { data: currentQuote } = await adminSupabase
      .from("quotes")
      .select("status")
      .eq("id", quoteId)
      .single();

    if (!currentQuote) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (currentQuote.status !== "freight_received") {
      return NextResponse.json(
        { error: `لا يمكن إرسال العرض — الحالة الحالية "${currentQuote.status}" يجب أن تكون "freight_received"` },
        { status: 409 }
      );
    }

    const offerToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (validityDays ?? 7));

    const { data: insertedOffer, error: insertError } = await adminSupabase
      .from("client_offers")
      .insert({
        quote_id: quoteId,
        materials_total: materialsTotal,
        freight_total: freightTotal,
        platform_fee: platformFee ?? 0,
        grand_total: grandTotal,
        validity_days: validityDays ?? 7,
        offer_token: offerToken,
        status: "sent",
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("offer insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    try {
      await sendClientOfferEmail({
        client_name: clientName,
        client_email: clientEmail,
        project_name: projectName,
        materials_total: materialsTotal,
        freight_total: freightTotal,
        platform_fee: platformFee ?? 0,
        grand_total: grandTotal,
        validity_days: validityDays ?? 7,
        offer_token: offerToken,
        delivery_address: deliveryAddress,
        delivery_date: deliveryDate,
      });
    } catch (emailError) {
      console.error("Offer email failed, rolling back:", emailError);
      await adminSupabase.from("client_offers").delete().eq("id", insertedOffer.id);
      return NextResponse.json({ error: "فشل إرسال الإيميل — لم يتم تحديث حالة الطلب" }, { status: 502 });
    }

    await adminSupabase.from("quotes").update({ status: "offer_sent" }).eq("id", quoteId);

    await adminSupabase.from("approvals").insert({
      entity_type: "client_offer",
      entity_id: quoteId,
      stage: "approve_final_offer",
      action: "approved",
      actor: auth.user?.email ?? "admin",
      notes: `عرض نهائي بقيمة ${grandTotal} ر.س — مرسل للعميل ${clientEmail}`,
    });

    return NextResponse.json({ ok: true, offer_token: offerToken });
  } catch (e) {
    console.error("offer/send error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}