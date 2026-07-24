import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  attachProcurementRequestFiles,
  createCustomerRequestLines,
  createExtractedRequestLines,
  createOutboxEvent,
  createProcurementRequest,
  findMatchingCarriers,
  findMatchingSuppliers,
  findOrCreateCustomerPartner,
  findOrCreateCustomerProject,
  generateProcurementTracking,
  listActiveMaterialCategories,
  listCatalogProductNames,
  listProductCategories,
  postProcurementRequestNote,
  resolveActiveServiceAreas,
  resolveExistingBrandIds,
  updateProcurementRequestCategories,
} from "@/lib/odoo";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone, regions } from "@/lib/vendor-options";
import { extractRequestItems } from "@/lib/material-extraction";

const MAX_FILES = 5;
const MAX_FILE_BASE64_LENGTH = 11_000_000; // ~8MB بعد فك الترميز
const MAX_ITEMS = 50;

function inferServiceAreaNames(text: string): string[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];
  return regions
    .filter((region) =>
      [region.ar, region.en, region.value]
        .map((value) => value.toLowerCase())
        .some((value) => normalized.includes(value))
    )
    .map((region) => region.ar);
}

function supplierMatchLine(supplier: { name: string; matchedCategoryCount: number; matchedBrandCount: number }): string {
  const parts = [];
  if (supplier.matchedBrandCount) parts.push(`${supplier.matchedBrandCount} علامة`);
  if (supplier.matchedCategoryCount) parts.push(`${supplier.matchedCategoryCount} فئة`);
  return `- ${supplier.name}${parts.length ? ` (${parts.join(" + ")})` : ""}`;
}

function carrierMatchLine(carrier: { name: string; matchedServiceAreaCount: number; matchedCategoryCount: number }): string {
  const parts = [];
  if (carrier.matchedServiceAreaCount) parts.push(`${carrier.matchedServiceAreaCount} منطقة خدمة`);
  if (carrier.matchedCategoryCount) parts.push(`${carrier.matchedCategoryCount} فئة مواد`);
  return `- ${carrier.name}${parts.length ? ` (${parts.join(" + ")})` : ""}`;
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
    email_verified_token: z.string().min(10, "يجب التحقق من البريد الإلكتروني أولاً"),
    phone: z
      .string()
      .trim()
      .transform((v) => normalizeVendorPhone(v))
      .refine(isValidVendorPhone, { message: "أدخل رقم جوال صحيح" }),
    // المشروع أهم بيانات الطلب — إلزامي
    project_name: z.string().trim().min(2, "اسم المشروع مطلوب"),
    delivery_latitude: z.number().min(-90).max(90).optional(),
    delivery_longitude: z.number().min(-180).max(180).optional(),
    // الرمز المختصر للعنوان الوطني: 4 أحرف + 4 أرقام (مثال: RRRD2929)
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
    turnstile_token: z.string().min(1, "يرجى إثبات أنك لست برنامجاً آلياً"),
  })
  .refine((data) => verifyEmailToken(data.email, data.email_verified_token), {
    path: ["email"],
    message: "انتهت صلاحية التحقق من البريد — أعد إرسال رمز OTP والتحقق مرة أخرى",
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

  try {
    const customerId = await findOrCreateCustomerPartner({
      contactName: data.contact_name,
      companyName: data.company_name || undefined,
      email: data.email,
      phone: data.phone,
    });

    const projectId = await findOrCreateCustomerProject(customerId, data.project_name);

    const requestId = await createProcurementRequest(
      {
        contactName: data.contact_name,
        companyName: data.company_name || undefined,
        email: data.email,
        phone: data.phone,
        projectName: data.project_name,
        deliveryLatitude: data.delivery_latitude,
        deliveryLongitude: data.delivery_longitude,
        nationalAddressCode: data.national_address_code || undefined,
        deliveryAddressNotes: data.delivery_address_notes || undefined,
        requestedDeliveryDate: data.requested_delivery_date || undefined,
        description: data.description,
      },
      [],
      customerId,
      projectId
    );

    let matchedCategoryIds: number[] = [];
    let requestedBrandNames: string[] = [];

    if (data.items.length) {
      requestedBrandNames = data.items.map((i) => i.brand || "").filter(Boolean);
      await createCustomerRequestLines(
        requestId,
        data.items.map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity,
          unit: i.unit || undefined,
          brand: i.brand || undefined,
          countryOfOrigin: i.countryOfOrigin || undefined,
        }))
      );
    } else if (data.description.trim().length >= 5 || data.files.length) {
      const [activeCategories, productCategories, catalogProductNames] = await Promise.all([
        listActiveMaterialCategories().catch(() => []),
        listProductCategories().catch(() => []),
        listCatalogProductNames().catch(() => []),
      ]);
      const extractedItems = await extractRequestItems(
        data.description,
        data.files.map((f) => ({ name: f.name, mimeType: f.mimeType, base64Data: f.base64Data })),
        activeCategories.map((c) => c.nameAr),
        catalogProductNames
      );
      if (extractedItems.length) {
        const productCategoryNameToId = new Map(productCategories.map((c) => [c.name, c.id]));
        await createExtractedRequestLines(requestId, extractedItems, productCategoryNameToId);

        const nameToId = new Map(activeCategories.map((c) => [c.nameAr, c.id]));
        matchedCategoryIds = [
          ...new Set(extractedItems.map((i) => i.category && nameToId.get(i.category)).filter((id): id is number => typeof id === "number")),
        ];
        requestedBrandNames = extractedItems.map((i) => i.brand || "").filter(Boolean);
      }
    }

    // توصيات داخلية فقط — لا إرسال RFQ تلقائي. الفئات توسّع نطاق البحث، والعلامة التجارية ترفع أولوية المورد.
    try {
      const categoryIds = [...new Set(matchedCategoryIds)];
      const brandIds = await resolveExistingBrandIds(requestedBrandNames);
      if (categoryIds.length) {
        await updateProcurementRequestCategories(requestId, categoryIds);
      }

      const serviceAreaNames = inferServiceAreaNames(`${data.delivery_address_notes || ""} ${data.project_name}`);
      const serviceAreaIds = serviceAreaNames.length ? await resolveActiveServiceAreas(serviceAreaNames) : [];
      const [suppliers, carriers] = await Promise.all([
        findMatchingSuppliers(categoryIds, brandIds),
        categoryIds.length || serviceAreaIds?.length ? findMatchingCarriers(categoryIds, serviceAreaIds || []) : Promise.resolve([]),
      ]);

      const noteParts: string[] = [];
      if (suppliers.length) {
        noteParts.push(`الموردون المقترحون بناءً على الفئات/العلامات التجارية:\n${suppliers.slice(0, 10).map(supplierMatchLine).join("\n")}`);
      }
      if (carriers.length) {
        noteParts.push(`وكلاء الشحن المقترحون عند الحاجة لشحن مستقل:\n${carriers.slice(0, 10).map(carrierMatchLine).join("\n")}`);
      }
      if (noteParts.length) {
        await postProcurementRequestNote(requestId, noteParts.join("\n\n"));
      }
    } catch (matchError) {
      console.error("[quotes/register] recommendation matching failed (non-blocking):", matchError instanceof Error ? matchError.message : matchError);
    }

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
