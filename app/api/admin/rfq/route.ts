import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendRfqToVendor } from "@/lib/email";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { checkAdminAuth, authError } from "@/lib/api-auth";

const getAdminClient = () => createServiceRoleClient();

// GET /api/admin/rfq?quoteId=xxx
export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "RFQ");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

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
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "RFQ");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

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
    actor: auth.user?.email ?? "admin",
    notes: `تم إرسال RFQ لـ ${(createdRfqs ?? []).length} مورد`,
  });

  // إرسال الإيميلات
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

  const vendorMap = new Map((vendors ?? []).map((v) => [v.id, v]));
  const emailResults = await Promise.allSettled(
    (createdRfqs ?? []).map((rfq) => {
      const vendor = vendorMap.get(rfq.vendor_id);
      if (!vendor?.email) return Promise.resolve();
      return sendRfqToVendor({
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
    })
  );

  const failedCount = emailResults.filter((r) => r.status === "rejected").length;
  const rfqIds = (createdRfqs ?? []).map((r) => r.id);

  if (failedCount > 0) {
    return NextResponse.json({
      ok: true,
      rfqIds,
      warning: `تم إنشاء الـ RFQ لكن فشل إرسال ${failedCount} من ${emailResults.length} إيميل — تحقق من بريد الموردين`,
    }, { status: 207 });
  }

  return NextResponse.json({ ok: true, rfqIds });
}

// PATCH /api/admin/rfq — تحديث حالة RFQ
const VALID_RFQ_STATUSES = ["sent", "received", "no_response", "rejected"];

export async function PATCH(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "RFQ");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

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
