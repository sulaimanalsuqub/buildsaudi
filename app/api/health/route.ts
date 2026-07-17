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
  const odoo = await checkOdoo();

  return NextResponse.json({
    ok: true,
    service: "buildsaudi",
    timestamp: new Date().toISOString(),
    env: {
      odoo_configured: Boolean(
        process.env.ODOO_BASE_URL && process.env.ODOO_DATABASE && process.env.ODOO_USERNAME && process.env.ODOO_API_KEY
      )
        ? "SET"
        : "MISSING",
      resend: process.env.RESEND_API_KEY ? "SET" : "MISSING",
      admin_email: process.env.ADMIN_EMAIL ? "SET" : "MISSING",
      quote_intake_email: process.env.QUOTE_INTAKE_EMAIL ? "SET" : "MISSING",
    },
    odoo: {
      connected: odoo.connected,
      authenticated: odoo.authenticated,
      models_accessible: odoo.modelsAccessible,
    },
  });
}
