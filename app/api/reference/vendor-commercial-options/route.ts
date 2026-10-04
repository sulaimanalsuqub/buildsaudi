import { NextRequest, NextResponse } from "next/server";
import { listVendorCommercialOptions, VendorRegistrationError } from "@/lib/vendor-registration";

export async function GET(request: NextRequest) {
  try {
    const language = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "ar";
    return NextResponse.json(
      { ok: true, ...(await listVendorCommercialOptions(language)) },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    console.error("[reference/vendor-commercial-options] Odoo unavailable", error instanceof VendorRegistrationError ? error.message : "internal error");
    // تحلّل بأمان: هذه الخيارات (عملة/دفع/إنكوترم) اختيارية وللموردين الدوليين فقط، وفي وضع ERPNext
    // غير مستخدمة. لا نُسقط فورم التسجيل عند تعذّر Odoo — نُرجع قوائم فارغة بدل 503.
    return NextResponse.json(
      { ok: true, currencies: [], paymentTerms: [], paymentMethods: [], incoterms: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
