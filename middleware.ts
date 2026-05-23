import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ====== تفعيل / إيقاف وضع الصيانة ======
// اضبط NEXT_PUBLIC_MAINTENANCE_MODE=true في .env.local أو Vercel لتفعيله
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL(ERPNEXT_URL || "/", request.url));
  }

  // إذا كان وضع الصيانة مفعلًا ولم يكن المسار هو صفحة الصيانة أو static/assets
  if (
    MAINTENANCE_MODE &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/static") &&
    !pathname.startsWith("/favicon") &&
    !pathname.startsWith("/icon") &&
    !pathname.startsWith("/apple-icon") &&
    !pathname.startsWith("/opengraph-image") &&
    !pathname.startsWith("/sitemap") &&
    !pathname.startsWith("/robots")
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // تابع عمل Supabase session كالمعتاد
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
