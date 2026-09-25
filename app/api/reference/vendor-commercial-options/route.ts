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
    return NextResponse.json({ error: "تعذر جلب خيارات المورد الدولي" }, { status: 503 });
  }
}
