import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendClientOfferEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const {
      quoteId,
      clientName,
      clientEmail,
      projectName,
      deliveryAddress,
      deliveryDate,
      materialsTotal,
      freightTotal,
      platformFee,
      grandTotal,
      validityDays,
    } = await req.json();

    if (!quoteId || !clientEmail || !materialsTotal || !freightTotal) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Generate a unique token for the offer link
    const offerToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (validityDays ?? 7));

    // Insert into client_offers
    const { error: insertError } = await adminSupabase.from("client_offers").insert({
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
    });

    if (insertError) {
      console.error("offer insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Advance quote status to offer_sent
    await adminSupabase
      .from("quotes")
      .update({ status: "offer_sent" })
      .eq("id", quoteId);

    // Send email to client
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

    return NextResponse.json({ ok: true, offer_token: offerToken });
  } catch (e) {
    console.error("offer/send error:", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
