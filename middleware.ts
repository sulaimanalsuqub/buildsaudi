import { type NextRequest, NextResponse } from "next/server";

// ====== تفعيل / إيقاف وضع الصيانة ======
// اضبط NEXT_PUBLIC_MAINTENANCE_MODE=true في .env.local أو Vercel لتفعيله
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
// ملاحظة: قراءة مباشرة بلا NEXT_PUBLIC_ — middleware يعمل على الخادم، والقيمة لا تدخل حزمة العميل
const ODOO_URL = process.env.ODOO_BASE_URL;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL(ODOO_URL || "/", request.url));
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
