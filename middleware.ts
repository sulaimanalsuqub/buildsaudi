import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ====== تفعيل / إيقاف وضع الصيانة ======
// غيّر إلى true لإيقاف الموقع مؤقتاً
const MAINTENANCE_MODE = true;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
