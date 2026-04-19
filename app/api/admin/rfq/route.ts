import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendRfqToVendor } from "@/lib/email";

const getAdminClient = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function authCheck() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/rfq?quoteId=xxx
export async function GET(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // Check admin role
  const { isUserAdmin } = await import("@/lib/auth/admin");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "ليس لديك صلاحيات إدارية" }, { status: 403 });
  }

  const quoteId = req.nextUrl.searchParams.get("quoteId");
  if (!quoteId) return NextResponse.json({ error: "quoteId مطلوب" }, { status: 400 });

  const adminSupabase = getAdminClient();
  const { data: rfqs, error } = await adminSupabase
    .from("rfqs")
    .select("*, vendors(id, establishment_name, manager_name, email)")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rfqs });
}

// POST /api/admin/rfq — إنشاء RFQs وإرسال إيميلات للموردين
export async function POST(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // Check admin role
  const { isUserAdmin } = await import("@/lib/auth/admin");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "ليس لديك صلاحيات إدارية" }, { status: 403 });
  }

  const { quoteId, vendorIds, deadline, notes } = await req.json();
  if (!quoteId || !vendorIds?.length || !deadline) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const adminSupabase = getAdminClient();

  // جلب بيانات الطلب والأصناف والموردين بشكل متوازٍ
  const [{ data: quote }, { data: items }, { data: vendors }] = await Promise.all([
    adminSupabase
      .from("quotes")
      .select("project_name, delivery_address, delivery_date")
      .eq("id", quoteId)
      .single(),
    adminSupabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true }),
    adminSupabase
      .from("vendors")
      .select("id, establishment_name, manager_name, email")
      .in("id", vendorIds)
      .eq("status", "active"),
  ]);

  if (!quote) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  // إنشاء سجلات RFQ
  const rfqInserts = (vendorIds as string[]).map((vendorId) => ({
    quote_id: quoteId,
    vendor_id: vendorId,
    deadline,
    notes: notes ?? null,
    status: "sent",
    sent_at: new Date().toISOString(),
  }));

  const { data: createdRfqs, error: rfqError } = await adminSupabase
    .from("rfqs")
    .insert(rfqInserts)
    .select();

  if (rfqError) return NextResponse.json({ error: rfqError.message }, { status: 500 });

  // تسجيل في سجل الموافقات
  await adminSupabase.from("approvals").insert({
    entity_type: "quote",
    entity_id: quoteId,
    stage: "send_rfq",
    action: "approved",
    actor: user?.email ?? "admin",
    notes: `تم إرسال RFQ لـ ${(createdRfqs ?? []).length} مورد`,
  });

  // إرسال الإيميلات (لا تفشل العملية إذا فشل إيميل واحد)
  const deliveryDate = new Date(quote.delivery_date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const deadlineFormatted = new Date(deadline).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  for (const rfq of createdRfqs ?? []) {
    const vendor = (vendors ?? []).find((v) => v.id === rfq.vendor_id);
    if (!vendor?.email) continue;
    try {
      await sendRfqToVendor({
        vendorName: vendor.establishment_name,
        managerName: vendor.manager_name,
        vendorEmail: vendor.email,
        rfqId: rfq.id,
        projectName: quote.project_name,
        deliveryAddress: quote.delivery_address,
        deliveryDate,
        deadline: deadlineFormatted,
        items: (items ?? []).map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
          description: i.description,
        })),
        notes,
      });
    } catch (e) {
      console.error("RFQ email failed for vendor", vendor.email, e);
    }
  }

  return NextResponse.json({ ok: true, rfqIds: (createdRfqs ?? []).map((r) => r.id) });
}

// PATCH /api/admin/rfq — تحديث حالة RFQ
const VALID_RFQ_STATUSES = ["sent", "received", "no_response", "rejected"];

export async function PATCH(req: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // Check admin role
  const { isUserAdmin } = await import("@/lib/auth/admin");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "ليس لديك صلاحيات إدارية" }, { status: 403 });
  }

  const { rfqId, status } = await req.json();
  if (!rfqId || !status) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  if (!VALID_RFQ_STATUSES.includes(status)) {
    return NextResponse.json({ error: "حالة RFQ غير مسموح بها" }, { status: 400 });
  }

  const adminSupabase = getAdminClient();
  const { error } = await adminSupabase.from("rfqs").update({ status }).eq("id", rfqId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
