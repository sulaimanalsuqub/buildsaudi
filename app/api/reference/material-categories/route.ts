import { NextResponse } from "next/server";
import { OdooClientError, listActiveMaterialCategories } from "@/lib/odoo";

export const dynamic = "force-dynamic";

/** قراءة فقط — الفئات Master Data تُدار حصراً من داخل Odoo، هذا المسار لا يُنشئ ولا يعدّل شيئاً */
export async function GET() {
  try {
    const categories = await listActiveMaterialCategories();
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[reference/material-categories][${error.correlationId}] ${error.kind}: ${error.message}`);
    } else {
      console.error("Failed to list material categories (unexpected):", error);
    }
    return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 500 });
  }
}
