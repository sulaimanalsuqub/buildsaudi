import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  attachProcurementRequestFiles,
  createOutboxEvent,
  createProcurementRequest,
  generateProcurementTracking,
  validateActiveCategoryIds,
} from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidVendorPhone, normalizeVendorPhone } from "@/lib/vendor-options";

const MAX_FILES = 5;
const MAX_FILE_BASE64_LENGTH = 11_000_000; // ~8MB بعد فك الترميز

const fileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1),
  base64Data: z.string().min(1).max(MAX_FILE_BASE64_LENGTH),
});

const registerSchema = z
  .object({
    contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    company_name: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    phone: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    // المشروع أهم بيانات الطلب — إلزامي
    project_name: z.string().trim().min(2, "اسم المشروع مطلوب"),
    delivery_latitude: z.number().min(-90).max(90),
    delivery_longitude: z.number().min(-180).max(180),
    delivery_address_notes: z.string().trim().max(500).optional().or(z.literal("")),
    requested_delivery_date: z.string().trim().optional().or(z.literal("")),
    description: z.string().trim().min(5, "أضف وصفاً للمواد أو المنتجات المطلوبة"),
    category_ids: z.array(z.number().int().positive()).min(1, "اختر فئة واحدة على الأقل"),
    files: z.array(fileSchema).max(MAX_FILES, "يمكن رفع 5 ملفات كحد أقصى").optional().default([]),
    turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
  })
  .refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
    path: ["email"],
    message: "انتهت صلاحية التحقق من البريد — أعد إرسال رمز OTP والتحقق مرة أخرى",
  });

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "طلبات التوريد");

  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "بيانات الطلب غير مكتملة أو غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const data = parsed.data;

  const humanVerified = await verifyTurnstileToken(data.turnstile_token, clientId);
  if (!humanVerified) {
    return NextResponse.json({ error: "تعذر التحقق من أنك لست برنامجاً آلياً — أعد تحميل الصفحة وحاول مجدداً" }, { status: 400 });
  }

  const categoriesValid = await validateActiveCategoryIds(data.category_ids);
  if (!categoriesValid) {
    return NextResponse.json({ error: "فئة أو أكثر لم تعد متاحة — أعد تحميل الصفحة واختر من جديد" }, { status: 400 });
  }

  try {
    const requestId = await createProcurementRequest(
      {
        contactName: data.contact_name,
        companyName: data.company_name || undefined,
        email: data.email,
        phone: data.phone,
        projectName: data.project_name,
        deliveryLatitude: data.delivery_latitude,
        deliveryLongitude: data.delivery_longitude,
        deliveryAddressNotes: data.delivery_address_notes || undefined,
        requestedDeliveryDate: data.requested_delivery_date || undefined,
        description: data.description,
      },
      data.category_ids
    );

    if (data.files.length) {
      await attachProcurementRequestFiles(requestId, data.files);
    }

    const { trackingNumber, trackingToken } = await generateProcurementTracking(requestId);

    const idempotencyKey = `procurement.request_received:${requestId}`;
    await createOutboxEvent({
      eventType: "procurement.request_received",
      resourceModel: "x_build_procurement_request",
      resourceId: requestId,
      procurementRequestId: requestId,
      idempotencyKey,
      payload: { request_id: requestId, tracking_token: trackingToken },
    });

    return NextResponse.json({ ok: true, tracking_number: trackingNumber, tracking_token: trackingToken });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[quotes/register][${error.correlationId}] ${error.kind}: ${error.message}`);
      const status = error.kind === "validation" ? 400 : error.kind === "conflict" ? 409 : 500;
      return NextResponse.json({ error: error.publicMessage }, { status });
    }
    console.error("Procurement request submission failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حفظ طلبكم في نظام العمليات" }, { status: 500 });
  }
}
