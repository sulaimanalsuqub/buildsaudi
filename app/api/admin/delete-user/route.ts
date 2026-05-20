import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { getUserRole } from "@/lib/auth/admin";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "حذف مستخدم");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const role = await getUserRole(auth.user?.id);
    if (role !== "admin") return authError("صلاحيات غير كافية — يتطلب دور admin", 403);

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "معرّف المستخدم مطلوب" }, { status: 400 });

    // منع حذف النفس
    if (userId === auth.user?.id) {
      return NextResponse.json({ error: "لا يمكنك حذف حسابك الخاص" }, { status: 409 });
    }

    const adminSupabase = createServiceRoleClient();

    // حذف من admin_users أولاً ثم من auth
    await adminSupabase.from("admin_users").delete().eq("id", userId);

    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error) {
      // لا نكشف رسالة Supabase الداخلية للمستخدم
      return NextResponse.json({ error: "تعذّر حذف المستخدم" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}