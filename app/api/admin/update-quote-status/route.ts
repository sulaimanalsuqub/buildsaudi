import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendQuoteStatusToClient, getClientNotifiableStatuses } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  admin_approved:          ["new"],
  rfq_sent:               ["admin_approved"],
  vendor_quotes_received: ["rfq_sent"],
  freight_sent:           ["vendor_quotes_received"],
  freight_received:       ["freight_sent"],
  offer_sent:             ["freight_received"],
  client_approved:        ["offer_sent"],
  payment_pending:        ["client_approved"],
  payment_confirmed:      ["payment_pending"],
  in_delivery:            ["payment_confirmed"],
  done:                   ["in_delivery"],
  cancelled: [
    "new", "admin_approved", "rfq_sent", "vendor_quotes_received",
    "freight_sent", "freight_received", "offer_sent", "client_approved",
    "payment_pending", "payment_confirmed", "in_delivery",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "تحديث الحالة");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const { quoteId, status } = await req.json();
    if (!quoteId || !status) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

    if (!VALID_TRANSITIONS[status]) {
      return NextResponse.json({ error: "الحالة غير مسموح بها" }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    const { data: current } = await adminSupabase
      .from("quotes")
      .select("status, client_name, client_email, project_name")
      .eq("id", quoteId)
      .single();

    if (!current) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    if (!VALID_TRANSITIONS[status].includes(current.status)) {
      return NextResponse.json(
        { error: `لا يمكن الانتقال من "${current.status}" إلى "${status}"` },
        { status: 409 }
      );
    }

    const { error } = await adminSupabase.from("quotes").update({ status }).eq("id", quoteId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await adminSupabase.from("approvals").insert({
      entity_type: "quote",
      entity_id: quoteId,
      stage: status,
      action: status === "cancelled" ? "rejected" : "approved",
      actor: auth.user?.email ?? "admin",
      notes: `${current.status} → ${status}`,
    });

    if (current.client_email && getClientNotifiableStatuses().includes(status)) {
      try {
        await sendQuoteStatusToClient({
          client_name: current.client_name,
          client_email: current.client_email,
          project_name: current.project_name,
          status,
        });
      } catch (e) {
        console.error("Client status email failed:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}