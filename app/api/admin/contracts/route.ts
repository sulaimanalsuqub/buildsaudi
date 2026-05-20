import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

// POST /api/admin/contracts — رفع عقد جديد (DB operations only, file upload done client-side)
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "contracts");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { title, fileUrl } = await req.json();
  if (!title?.trim() || !fileUrl?.trim()) {
    return NextResponse.json({ error: "العنوان ورابط الملف مطلوبان" }, { status: 400 });
  }

  // Basic URL validation
  try { new URL(fileUrl); } catch {
    return NextResponse.json({ error: "رابط الملف غير صحيح" }, { status: 400 });
  }

  const db = createServiceRoleClient();

  // أنشئ العقد الجديد أولاً — ثم عطّل القديم لمنع فقدان العقود عند فشل الإدراج
  const { data, error } = await db
    .from("contracts")
    .insert({ title: title.trim(), file_url: fileUrl.trim(), is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // عطّل العقود القديمة فقط بعد نجاح إنشاء الجديد
  await db.from("contracts")
    .update({ is_active: false })
    .eq("is_active", true)
    .neq("id", data.id);

  return NextResponse.json({ ok: true, contract: data });
}