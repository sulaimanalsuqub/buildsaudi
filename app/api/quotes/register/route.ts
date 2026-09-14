import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { checkSharedRateLimit } from "@/lib/shared-store";
import { validateSafeUpload } from "@/lib/file-validation";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone } from "@/lib/vendor-options";

// Odoo is permanently inaccessible (2026-09-14). Calls Build-OPT's public bridge
// (app/api/public/procurement-requests/route.ts), which creates a plain procurement_requests +
// procurement_request_lines row — the same tables its own ops sourcing UI already works against
// (verified working this session: supplier matching, RFQ generation).
//
// Deliberately dropped vs. the old Odoo path, pending a follow-up phase:
// - AI item extraction from free-text/files (DeepSeek) and AI supplier/carrier match
//   recommendations at submission time — ops staff now does sourcing manually inside Build-OPT's
//   own /requests UI instead, which is a superset of what the old auto-suggestion did.
// - File attachments — the bridge has no attachment storage yet (no Supabase Storage wired up on
//   Build-OPT's side for this). File names are appended to the request notes so ops staff know
//   to follow up for the actual files; the binary content itself is not persisted.
// - The old secure tracking_token (Odoo server action) — the bridge returns a request number
//   (e.g. REQ-260913-0001) with no separate secret. /api/quotes/track and /ar/track-request
//   still expect a token and are NOT yet updated to match — tracking-by-link is a known gap,
//   not silently broken (the track page's own error message says so).
const MAX_FILES = 5;
const MAX_FILE_BASE64_LENGTH = 11_000_000;
const MAX_ITEMS = 50;

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
    turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
  })
  .refine((data) => data.description.trim().length >= 5 || data.items.length > 0 || data.files.length > 0, {
    path: ["description"],
    message: "أضف وصفاً، أو أصنافاً، أو ارفع ملفاً للمواد المطلوبة",
  })
  .refine((data) => !!data.national_address_code || !!data.delivery_address_notes, {
    path: ["delivery_address_notes"],
    message: "حدد موقع التسليم: رمز العنوان الوطني، أو المدينة والحي",
  });

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

  const baseUrl = process.env.BUILD_OPT_API_URL;
  const secret = process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  if (!baseUrl || !secret) {
    console.error("[quotes/register] BUILD_OPT_API_URL / PUBLIC_INTAKE_SERVICE_SECRET not configured");
    return NextResponse.json({ error: "تعذر حفظ طلبكم في نظام العمليات" }, { status: 500 });
  }

  const notesParts = [data.description.trim(), (data.delivery_address_notes ?? "").trim()].filter(Boolean);
  if (data.files.length) {
    notesParts.push(`مرفق ${data.files.length} ملف من العميل (لم يُخزَّن آلياً بعد — تواصل مع العميل للحصول عليه): ${data.files.map((f) => f.name).join(", ")}`);
  }

  try {
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
        notes: notesParts.join("\n\n") || undefined,
        requestedDeliveryDate: data.requested_delivery_date || undefined,
        lines: data.items.map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity,
          uom: i.unit || "قطعة",
          brandFreeText: i.brand || undefined,
          countryOfOrigin: undefined,
        })),
      }),
    });
    const body = (await res.json().catch(() => null)) as { requestNumber?: string; error?: string; message?: string } | null;
    if (!res.ok) {
      console.error(`[quotes/register] bridge returned ${res.status}: ${body?.error ?? "unknown"}`);
      return NextResponse.json({ error: body?.message || "تعذر حفظ طلبكم في نظام العمليات" }, { status: res.status >= 500 ? 500 : 400 });
    }
    return NextResponse.json({ ok: true, tracking_number: body?.requestNumber, tracking_token: "" });
  } catch (error) {
    console.error("[quotes/register] bridge unreachable:", error);
    return NextResponse.json({ error: "تعذر حفظ طلبكم في نظام العمليات" }, { status: 500 });
  }
}
