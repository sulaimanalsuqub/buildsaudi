import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin, requireAdminRole } from "@/lib/auth/admin";

export async function checkAdminAuth() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "غير مصرح", status: 401, user: null };
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return { ok: false, error: "ليس لديك صلاحيات إدارية", status: 403, user };
    }

    return { ok: true, user };
  } catch (err) {
    console.error("Auth check failed:", err);
    return { ok: false, error: "خطأ في التحقق من الصلاحيات", status: 500, user: null };
  }
}

export function authError(error: string, status: number = 401) {
  return NextResponse.json({ error }, { status });
}
