import { NextResponse } from "next/server";
import { vendorOdooCall } from "@/lib/vendor-registration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Read-only: test the native models used by registration, not legacy x_build_* models.
    await Promise.all(["res.partner", "product.category", "res.partner.category"].map((model) =>
      vendorOdooCall(model, "search_read", { domain: [], fields: ["id"], limit: 1 }),
    ));
    return NextResponse.json({ ok: true, service: "supplier-registration", backend: "odoo", authenticated: true });
  } catch {
    return NextResponse.json({ ok: false, service: "supplier-registration", backend: "odoo", authenticated: false }, { status: 503 });
  }
}
