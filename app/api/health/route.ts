import { NextResponse } from "next/server";
import { searchRead } from "@/lib/odoo";

export const dynamic = "force-dynamic";

async function checkOdoo(): Promise<{ connected: boolean; authenticated: boolean; modelsAccessible: boolean }> {
  const hasConfig = Boolean(
    process.env.ODOO_BASE_URL && process.env.ODOO_DATABASE && process.env.ODOO_USERNAME && process.env.ODOO_API_KEY
  );
  if (!hasConfig) {
    return { connected: false, authenticated: false, modelsAccessible: false };
  }

  try {
    // نجاح هذا الاستعلام يثبت: الاتصال + التوثيق + إمكانية الوصول للموديلات المطلوبة معاً
    await searchRead("x_build_supplier_profile", [], ["id"], { limit: 1 });
    await searchRead("x_build_integration_outbox", [], ["id"], { limit: 1 });
    return { connected: true, authenticated: true, modelsAccessible: true };
  } catch (e) {
    // التفاصيل داخلياً فقط — لا تُكشف للعميل
    console.error("[Health] Odoo check failed:", e);
    return { connected: true, authenticated: false, modelsAccessible: false };
  }
}

export async function GET() {
  const erpnextUrl = process.env.ERPNEXT_URL;
  const hasErpnextToken = Boolean(process.env.ERPNEXT_API_TOKEN);

  let erpnextReachable = false;
  let erpnextError = "";

  if (erpnextUrl && hasErpnextToken) {
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
      console.error("[Health] ERPNext ping failed:", e);
      erpnextError = "connection failed";
    }
  }

  const odoo = await checkOdoo();

  return NextResponse.json({
    ok: true,
    service: "buildsaudi",
    timestamp: new Date().toISOString(),
    env: {
      erpnext_url: erpnextUrl ? erpnextUrl.slice(0, 30) + "…" : "MISSING",
      erpnext_token: hasErpnextToken ? "SET" : "MISSING",
      odoo_configured: Boolean(
        process.env.ODOO_BASE_URL && process.env.ODOO_DATABASE && process.env.ODOO_USERNAME && process.env.ODOO_API_KEY
      )
        ? "SET"
        : "MISSING",
      resend: process.env.RESEND_API_KEY ? "SET" : "MISSING",
      admin_email: process.env.ADMIN_EMAIL ? "SET" : "MISSING",
    },
    erpnext_reachable: erpnextReachable,
    erpnext_error: erpnextError || undefined,
    odoo: {
      connected: odoo.connected,
      authenticated: odoo.authenticated,
      models_accessible: odoo.modelsAccessible,
    },
  });
}
