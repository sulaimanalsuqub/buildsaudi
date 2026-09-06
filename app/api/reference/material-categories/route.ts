import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BuildOptCategory = { nameAr: string; nameEn: string };

/**
 * قراءة فقط — الفئات الآن تُقرأ من Build-OPT (نظامنا الخاص) بدل أودو، لأن أودو معرّض لانقطاعات
 * تشغيلية خارجة عن سيطرتنا (ترقيات Odoo Online) تمنع التسجيل بالكامل. الاسم العربي نفسه يُستخدم
 * كمعرّف مستقر (id) — يُرسَل لاحقاً كـ category_names لبيلد-أوبت، الذي يطابقها بالاسم أصلاً
 * (resolveCategoryIdsByName)، لا بمعرّف رقمي داخلي.
 */
export async function GET() {
  const baseUrl = process.env.BUILD_OPT_BASE_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[reference/material-categories] BUILD_OPT_BASE_URL/PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/public/product-categories`, {
      headers: { "x-service-secret": secret },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`build-opt returned ${res.status}`);

    const body = (await res.json()) as { categories?: BuildOptCategory[] };
    if (!Array.isArray(body.categories)) throw new Error("unexpected response shape");

    const categories = body.categories.map((c) => ({ id: c.nameAr, nameAr: c.nameAr, nameEn: c.nameEn }));
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    console.error("[reference/material-categories] failed to fetch from build-opt:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذر جلب قائمة الفئات" }, { status: 500 });
  }
}
