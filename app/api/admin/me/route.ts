import { NextResponse } from "next/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";

export async function GET() {
  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  return NextResponse.json({
    ok: true,
    user: {
      id: auth.user?.id,
      email: auth.user?.email,
    },
  });
}
