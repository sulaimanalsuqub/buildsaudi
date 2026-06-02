import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const erpnextUrl = process.env.ERPNEXT_URL;
  const hasToken = Boolean(process.env.ERPNEXT_API_TOKEN);

  let erpnextReachable = false;
  let erpnextError = "";

  if (erpnextUrl && hasToken) {
    try {
      const res = await fetch(`${erpnextUrl.replace(/\/$/, "")}/api/method/ping`, {
        headers: {
          Authorization: `token ${process.env.ERPNEXT_API_TOKEN}`,
        },
        cache: "no-store",
      });
      erpnextReachable = res.ok;
      if (!res.ok) erpnextError = `HTTP ${res.status}`;
    } catch (e) {
      // تسجيل التفاصيل داخلياً فقط — لا تُكشف للعميل
      console.error("[Health] ERPNext ping failed:", e);
      erpnextError = "connection failed";
    }
  }

  return NextResponse.json({
    ok: true,
    service: "buildsaudi",
    timestamp: new Date().toISOString(),
    env: {
      erpnext_url: erpnextUrl ? erpnextUrl.slice(0, 30) + "…" : "MISSING",
      erpnext_token: hasToken ? "SET" : "MISSING",
      resend: process.env.RESEND_API_KEY ? "SET" : "MISSING",
      admin_email: process.env.ADMIN_EMAIL ? "SET" : "MISSING",
    },
    erpnext_reachable: erpnextReachable,
    erpnext_error: erpnextError || undefined,
  });
}
