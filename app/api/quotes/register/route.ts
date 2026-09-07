import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { claimSubmission, saveSubmissionState, checkSharedRateLimit, type SubmissionState } from "@/lib/shared-store";
import { rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { validateSafeUpload } from "@/lib/file-validation";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone, supplierCountries } from "@/lib/vendor-options";
import { extractRequestItems } from "@/lib/material-extraction";

const MAX_FILES = 5;
const MAX_FILE_BASE64_LENGTH = 11_000_000; // ~8MB بعد فك الترميز
const MAX_ITEMS = 50;

/** يحاول استرجاع رمز ISO من الاسم المعروض (بالعربي أو الإنجليزي) — يرجع undefined لو غير معروف؛
 * أصل المنتج نص حر أوسع من قائمة دول التسجيل التسع، فعدم التطابق متوقع وليس خطأ */
function resolveCountryCode(display: string | undefined): string | undefined {
  if (!display) return undefined;
  const match = supplierCountries.find((c) => c.ar === display || c.en === display);
  if (!match || match.value === "other" || match.value.length !== 2) return undefined;
  return match.value.toUpperCase();
}

const fileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1),
  base64Data: z.string().min(1).max(MAX_FILE_BASE64_LENGTH),
});

const itemSchema = z.object({
  itemName: z.string().trim().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  brand: z.string().trim().max(100).refine(isEnglishBrandName, "اكتب اسم العلامة التجارية بالإنجليزي فقط").optional().or(z.literal("")),
  countryOfOrigin: z.string().trim().max(100).optional().or(z.literal("")),
});

const registerSchema = z
  .object({
    contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب"),
    company_name: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
    phone: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    project_name: z.string().trim().min(2, "اسم المشروع مطلوب"),
    delivery_latitude: z.number().min(-90).max(90).optional(),
    delivery_longitude: z.number().min(-180).max(180).optional(),
    national_address_code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{4}\d{4}$/, "رمز العنوان الوطني يجب أن يكون 4 أحرف ثم 4 أرقام")
      .optional()
      .or(z.literal("")),
    delivery_address_notes: z.string().trim().max(500).optional().or(z.literal("")),
    requested_delivery_date: z.string().trim().optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")).default(""),
    items: z.array(itemSchema).max(MAX_ITEMS, "الحد الأقصى 50 صنفاً").optional().default([]),
    files: z.array(fileSchema).max(MAX_FILES, "يمكن رفع 5 ملفات كحد أقصى").optional().default([]),
    submission_id: z.string().uuid("معرف الإرسال غير صحيح"),
    privacy_accepted: z.literal(true, { message: "يجب الموافقة على سياسة الخصوصية" }),
    turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
  })
  .refine((data) => data.description.trim().length >= 5 || data.items.length > 0 || data.files.length > 0, {
    path: ["description"],
    message: "أضف وصفاً، أو أصنافاً، أو ارفع ملفاً للمواد المطلوبة",
  })
  .refine(
    (data) => (data.delivery_latitude !== undefined && data.delivery_longitude !== undefined) || !!data.national_address_code || !!data.delivery_address_notes,
    {
      path: ["delivery_address_notes"],
      message: "حدد موقع التسليم: على الخريطة، أو رمز العنوان الوطني، أو المدينة والحي",
    }
  );

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  try {
    const { ok, resetAt } = await checkSharedRateLimit(`procurement-submit:${clientId}`, 10, 60 * 60);
    if (!ok) return rateLimitError(resetAt, "طلبات التوريد");
  } catch {
    return NextResponse.json({ error: "تعذر تأمين الطلب ضد الإساءة بشكل موثوق؛ حاول لاحقاً" }, { status: 503 });
  }

  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "بيانات الطلب غير مكتملة أو غير صحيحة";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const data = parsed.data;
  for (const file of data.files) {
    const validation = validateSafeUpload(file);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const humanVerified = await verifyTurnstileToken(data.turnstile_token, clientId);
  if (!humanVerified) {
    return NextResponse.json({ error: "تعذر التحقق من أنك لست برنامجاً آلياً — أعد تحميل الصفحة وحاول مجدداً" }, { status: 400 });
  }

  const baseUrl = process.env.BUILD_OPT_BASE_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[quotes/register] BUILD_OPT_BASE_URL/PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "نظام استقبال الطلبات غير مهيّأ حالياً — حاول لاحقاً" }, { status: 503 });
  }

  const submissionKey = `procurement-submission:${data.submission_id}`;
  const correlationId = randomUUID();
  const initialState: SubmissionState = { status: "processing", operation: "customer_submission", submissionId: data.submission_id, correlationId, stage: "validated" };
  let submissionState: SubmissionState = initialState;
  try {
    const reservation = await claimSubmission(submissionKey, initialState);
    submissionState = reservation.state;
    if (!reservation.claimed) {
      if (submissionState.status === "completed" && submissionState.trackingNumber) {
        return NextResponse.json({ ok: true, replayed: true, tracking_number: submissionState.trackingNumber });
      }
      return NextResponse.json({ error: "طلبكم قيد المعالجة بالفعل؛ أعد المحاولة بعد لحظات", correlation_id: submissionState.correlationId }, { status: 202 });
    }
  } catch (error) {
    console.error("[quotes/register] durable idempotency unavailable:", error);
    return NextResponse.json({ error: "تعذر تأمين طلبكم بشكل موثوق؛ حاول لاحقاً" }, { status: 503 });
  }

  try {
    // بنود مباشرة إن أدخلها العميل يدوياً، وإلا استخلاص عبر DeepSeek من الوصف/الملفات المرفقة —
    // هذا الاستخلاص لا يعتمد على أودو إطلاقاً (lib/material-extraction.ts مستقل تماماً).
    let items = data.items;
    if (!items.length && (data.description.trim().length >= 5 || data.files.length)) {
      const extracted = await extractRequestItems(
        data.description,
        data.files.map((f) => ({ name: f.name, mimeType: f.mimeType, base64Data: f.base64Data })),
        [],
        []
      );
      items = extracted.map((i) => ({ itemName: i.itemName, quantity: i.quantity, unit: i.unit || "", brand: i.brand || "", countryOfOrigin: i.countryOfOrigin || "" }));
    }

    // لا عمود مخصّص بعد بـBuild-OPT لموقع التسليم التفصيلي (عنوان وطني/إحداثيات) — يُضاف كنص
    // واضح داخل notes بدل توسيع سكيمة procurement_requests الآن (docs: PROGRESS.md).
    const deliveryParts = [
      data.national_address_code ? `الرمز الوطني: ${data.national_address_code}` : null,
      data.delivery_latitude !== undefined && data.delivery_longitude !== undefined
        ? `الإحداثيات: ${data.delivery_latitude}, ${data.delivery_longitude}`
        : null,
      data.delivery_address_notes || null,
    ].filter(Boolean);
    const notes = [data.description.trim(), deliveryParts.length ? `موقع التسليم — ${deliveryParts.join(" | ")}` : null]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 5000);

    const res = await fetch(`${baseUrl}/api/public/procurement-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-secret": secret },
      body: JSON.stringify({
        submissionId: data.submission_id,
        legalName: data.company_name || undefined,
        contactName: data.contact_name,
        contactEmail: data.email,
        contactPhone: data.phone,
        countryCode: "SA",
        projectName: data.project_name,
        notes: notes || undefined,
        requestedDeliveryDate: data.requested_delivery_date || undefined,
        lines: items.map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity,
          uom: i.unit || "قطعة",
          brandFreeText: i.brand || undefined,
          countryOfOrigin: resolveCountryCode(i.countryOfOrigin),
        })),
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`build-opt returned ${res.status}`);
    const body = (await res.json()) as { requestNumber?: string };
    const trackingNumber = body.requestNumber ?? data.submission_id;

    submissionState = { ...submissionState, status: "completed", trackingNumber, stage: "completed" };
    await saveSubmissionState(submissionKey, submissionState);
    return NextResponse.json({ ok: true, tracking_number: trackingNumber, correlation_id: correlationId });
  } catch (error) {
    try {
      await saveSubmissionState(submissionKey, {
        ...submissionState,
        status: "failed",
        stage: submissionState.stage ?? "unknown",
        error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
      });
    } catch (stateError) {
      console.error("[quotes/register] unable to record failed submission:", stateError);
    }
    console.error("[quotes/register] failed to reach build-opt:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذر حفظ طلبكم في نظام العمليات" }, { status: 500 });
  }
}
