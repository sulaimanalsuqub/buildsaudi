import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Odoo is permanently inaccessible (2026-09-14) — this now reads from Build-OPT's own
// product_categories table via its public service-to-service bridge (app/api/public/
// product-categories/route.ts on opt.build.com.sa), not Odoo. That bridge resolves categories
// by name server-side (resolveCategoryIdsByName), not numeric id, so there is no stable id to
// return here — id is a synthetic per-response index, good enough for React keys/checkbox state
// in this form, not a durable identifier. Whichever route consumes selected categories downstream
// must switch to sending category names, not these ids, once it's rewired off Odoo too.
export async function GET() {
  const baseUrl = process.env.BUILD_OPT_API_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[reference/material-categories] BUILD_OPT_API_URL / PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 500 });
  }
  try {
    const res = await fetch(`${baseUrl}/api/public/product-categories`, {
      headers: { "x-service-secret": secret },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[reference/material-categories] bridge returned ${res.status}`);
      return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 500 });
    }
    const body = (await res.json()) as { categories: { nameAr: string; nameEn: string }[] };
    const categories = body.categories.map((c, i) => ({ id: i + 1, nameAr: c.nameAr, nameEn: c.nameEn }));
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    console.error("[reference/material-categories] bridge unreachable:", error);
    return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 500 });
  }
}
