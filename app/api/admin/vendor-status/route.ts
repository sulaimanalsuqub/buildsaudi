import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendVendorActivatedEmail, sendVendorRejectedEmail } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  active:   ["pending", "paused", "rejected"],
  rejected: ["pending"],
  paused:   ["active"],
};

const STAGE_MAP: Record<string, string> = {
  active:   "activate_vendor",
  rejected: "reject_vendor",
  paused:   "pause_vendor",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { vendorId, status } = await req.json();
    if (!vendorId || !status) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    if (!VALID_TRANSITIONS[status]) {
      return NextResponse.json({ error: "الحالة غير مسموح بها" }, { status: 400 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // جلب بيانات المورد الحالية
    const { data: vendor } = await adminSupabase
      .from("vendors")
      .select("id, status, establishment_name, manager_name, email")
      .eq("id", vendorId)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
    }

    if (!VALID_TRANSITIONS[status].includes(vendor.status)) {
      return NextResponse.json(
        { error: `لا يمكن الانتقال من "${vendor.status}" إلى "${status}"` },
        { status: 409 },
      );
    }

    // تحديث حالة المورد
    const { error } = await adminSupabase
      .from("vendors")
      .update({ status })
      .eq("id", vendorId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // تسجيل في سجل الموافقات
    await adminSupabase.from("approvals").insert({
      entity_type: "vendor",
      entity_id: vendorId,
      stage: STAGE_MAP[status],
      action: status === "rejected" ? "rejected" : "approved",
      actor: user.email ?? "admin",
      notes: `${vendor.status} → ${status}`,
    });

    // إرسال إيميل عند التفعيل أو الرفض
    if (vendor.email && (status === "active" || status === "rejected")) {
      try {
        if (status === "active") {
          await sendVendorActivatedEmail({
            establishment_name: vendor.establishment_name,
            manager_name: vendor.manager_name,
            email: vendor.email,
          });
        } else {
          await sendVendorRejectedEmail({
            establishment_name: vendor.establishment_name,
            manager_name: vendor.manager_name,
            email: vendor.email,
          });
        }
      } catch (e) {
        console.error("Vendor status email failed:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
