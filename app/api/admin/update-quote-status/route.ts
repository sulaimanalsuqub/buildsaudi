import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// تسلسل الحالات الصحيح — كل حالة تقبل الانتقال إليها من الحالات المدرجة فقط
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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { quoteId, status } = await req.json();
    if (!quoteId || !status) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

    if (!VALID_TRANSITIONS[status]) {
      return NextResponse.json({ error: "الحالة غير مسموح بها" }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // التحقق من الحالة الحالية قبل التحديث
    const { data: current } = await adminSupabase
      .from("quotes")
      .select("status")
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
