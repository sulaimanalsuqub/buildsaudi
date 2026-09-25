import { NextResponse } from "next/server";
import { listVendorCategories } from "@/lib/vendor-registration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listVendorCategories();
    return NextResponse.json({ ok: true, categories });
  } catch {
    console.error("[reference/material-categories] Odoo catalog unavailable");
    return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 503 });
  }
}
