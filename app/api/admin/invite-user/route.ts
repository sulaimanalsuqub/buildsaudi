import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/site";

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
    if (!rlOk) return rateLimitError(resetAt, "دعوة مستخدم");

    const auth = await checkAdminAuth();
    if (!auth.ok) return authError(auth.error!, auth.status);

    const { email, role = "viewer" } = await req.json();
    if (!email) return NextResponse.json({ error: "البريد مطلوب" }, { status: 400 });

    const validRoles = ["admin", "moderator", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "الدور غير مسموح به" }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    const { data: invited, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteConfig.url}/admin`,
    });

    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

    // إضافة المستخدم المدعو إلى admin_users مباشرة
    if (invited?.user?.id) {
      await adminSupabase.from("admin_users").upsert({
        id: invited.user.id,
        email,
        role,
        is_active: true,
      }, { onConflict: "id" });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
