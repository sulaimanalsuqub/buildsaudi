import { NextRequest, NextResponse } from "next/server";
import { getERPNextDocument } from "@/lib/erpnext";
import { parseVendorOnboardingToken, verifyVendorOnboardingToken } from "@/lib/vendor-onboarding-token";

type SupplierRecord = {
  name: string;
  supplier_name: string;
  build_email?: string;
  build_manager_name?: string;
  build_supplier_stage?: string;
  build_profile_completed?: number;
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "رمز الدعوة مطلوب" }, { status: 400 });
  }

  const parsed = parseVendorOnboardingToken(token);
  if (!parsed) {
    return NextResponse.json({ error: "رمز الدعوة غير صالح" }, { status: 400 });
  }

  const supplier = await getERPNextDocument<SupplierRecord>("Supplier", parsed.supplierName);
  if (!supplier?.build_email) {
    return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
  }

  if (supplier.build_supplier_stage !== "Approved") {
    return NextResponse.json({ error: "لم تتم الموافقة على طلبكم بعد" }, { status: 403 });
  }

  if (supplier.build_profile_completed) {
    return NextResponse.json({ error: "تم إكمال الملف مسبقاً", completed: true }, { status: 409 });
  }

  if (!verifyVendorOnboardingToken(supplier.name, supplier.build_email, token)) {
    return NextResponse.json({ error: "انتهت صلاحية الرابط" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    supplier_id: supplier.name,
    establishment_name: supplier.supplier_name,
    manager_name: supplier.build_manager_name || "",
    email: supplier.build_email,
  });
}