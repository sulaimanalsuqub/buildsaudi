import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    // Check admin role
    const { isUserAdmin } = await import("@/lib/auth/admin");
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "ليس لديك صلاحيات إدارية" }, { status: 403 });
    }

    const { quoteId } = await req.json();
    if (!quoteId) return NextResponse.json({ error: "معرّف الطلب مطلوب" }, { status: 400 });

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // التحقق من حالة الطلب — لا يمكن حذف طلب في مرحلة متقدمة
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

    // تسجيل في سجل الموافقات قبل الحذف
    await adminSupabase.from("approvals").insert({
      entity_type: "quote",
      entity_id: quoteId,
      stage: "delete_quote",
      action: "approved",
      actor: user.email ?? "admin",
      notes: `تم حذف طلب في حالة "${quote.status}"`,
    });

    const { error } = await adminSupabase.from("quotes").delete().eq("id", quoteId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
