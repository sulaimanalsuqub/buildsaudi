import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  OdooClientError,
  attachProcurementRequestFiles,
  createCustomerRequestLines,
  createExtractedRequestLines,
  createAiRecommendationWorkflow,
  createOutboxEvent,
  createProcurementRequest,
  findMatchingCarriers,
  findMatchingSuppliers,
  findOrCreateCustomerPartner,
  findOrCreateCustomerProject,
  findProcurementRequestBySubmissionKey,
  generateProcurementTracking,
  listActiveMaterialCategories,
  listCatalogProductNames,
  listProductCategories,
  postProcurementRequestNote,
  resolveActiveLogisticsServices,
  resolveActiveServiceAreas,
  resolveExistingBrandIds,
  updateProcurementRequestCategories,
} from "@/lib/odoo";
import { claimSubmission, saveSubmissionState, type SubmissionState } from "@/lib/shared-store";
import { rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { checkSharedRateLimit } from "@/lib/shared-store";
import { validateSafeUpload } from "@/lib/file-validation";
import { verifyEmailToken } from "@/lib/otp";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isEnglishBrandName, isValidVendorPhone, normalizeVendorPhone, regions } from "@/lib/vendor-options";
import { extractRequestItems } from "@/lib/material-extraction";

const MAX_FILES = 5;
const MAX_FILE_BASE64_LENGTH = 11_000_000; // ~8MB بعد فك الترميز
const MAX_ITEMS = 50;

const SAUDI_ORIGIN_NAMES = ["السعودية", "المملكة العربية السعودية", "saudi arabia", "saudi", "ksa", "sa"];

/** يحدّد إن كان بند مصدره خارج السعودية (نص حر غير موحّد) — فارغ/غير محدد يُعامَل محلياً افتراضياً لتفادي تشديد المطابقة بلا داعٍ */
function isInternationalOrigin(countryOfOrigin: string | undefined): boolean {
  const normalized = (countryOfOrigin || "").trim().toLowerCase();
  if (!normalized) return false;
  return !SAUDI_ORIGIN_NAMES.includes(normalized);
}

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
    submission_id: z.string().uuid("معرف الإرسال غير صحيح"),
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

  const submissionKey = `procurement-submission:${data.submission_id}`;
  const correlationId = randomUUID();
  const initialState: SubmissionState = { status: "processing", submissionId: data.submission_id, correlationId, stage: "validated" };
  let submissionState: SubmissionState = initialState;
  try {
    const reservation = await claimSubmission(submissionKey, initialState);
    submissionState = reservation.state;
    if (!reservation.claimed) {
      if (submissionState.status === "completed" && submissionState.trackingNumber && submissionState.trackingToken) {
        return NextResponse.json({ ok: true, replayed: true, tracking_number: submissionState.trackingNumber, tracking_token: submissionState.trackingToken });
      }
      // A concurrent invocation owns this submission. Do not start a second Odoo workflow.
      return NextResponse.json({ error: "طلبكم قيد المعالجة بالفعل؛ أعد المحاولة بعد لحظات", correlation_id: submissionState.correlationId }, { status: 202 });
    }
  } catch (error) {
    console.error("[quotes/register] durable idempotency unavailable:", error);
    return NextResponse.json({ error: "تعذر تأمين طلبكم بشكل موثوق؛ حاول لاحقاً" }, { status: 503 });
  }

  let createdRequestId: number | null = null;
  try {
    const customerId = await findOrCreateCustomerPartner({
      contactName: data.contact_name,
      companyName: data.company_name || undefined,
      email: data.email,
      phone: data.phone,
    });

    const projectId = await findOrCreateCustomerProject(customerId, data.project_name);

    // Recovery after a timeout is keyed in Odoo as well as the shared store.  A schema migration
    // makes x_studio_submission_key unique; without it production must not be released.
    const prior = await findProcurementRequestBySubmissionKey(data.submission_id);
    if (prior && (!prior.trackingNumber || !prior.trackingToken)) {
      // A prior invocation committed part of the request but not a safe completion. Do not guess
      // which child writes ran; reconciliation owns it and this retry must not duplicate lines/files.
      submissionState = { ...submissionState, status: "failed", requestId: prior.id, stage: "reconciliation_required", error: "Existing incomplete Odoo submission" };
      await saveSubmissionState(submissionKey, submissionState);
      await postProcurementRequestNote(prior.id, `طلب الموقع ذو مفتاح الإرسال ${data.submission_id} يحتاج reconciliation: سجل موجود بلا tracking مكتمل. لا تُنشأ بنود/مرفقات مكررة تلقائياً.`).catch(() => undefined);
      return NextResponse.json({ error: "طلب سابق يحتاج مراجعة تشغيلية قبل استئناف المعالجة", correlation_id: correlationId }, { status: 409 });
    }
    if (prior?.trackingNumber && prior.trackingToken) {
      // A prior invocation can have committed tracking then timed out before its
      // notification outbox write. Reconcile that idempotently before acknowledging
      // the replay as complete.
      await createOutboxEvent({
        eventType: "procurement.request_received",
        resourceModel: "x_build_procurement_request",
        resourceId: prior.id,
        procurementRequestId: prior.id,
        idempotencyKey: `procurement.request_received:${prior.id}`,
        payload: { request_id: prior.id, tracking_token: prior.trackingToken },
      });
      submissionState = { ...submissionState, status: "completed", requestId: prior.id, trackingNumber: prior.trackingNumber, trackingToken: prior.trackingToken, stage: "recovered_completed" };
      await saveSubmissionState(submissionKey, submissionState);
      return NextResponse.json({ ok: true, replayed: true, tracking_number: prior.trackingNumber, tracking_token: prior.trackingToken, correlation_id: correlationId });
    }
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
      projectId,
      data.submission_id
    );
    createdRequestId = requestId;
    submissionState = { ...submissionState, requestId, stage: "request_created" };
    await saveSubmissionState(submissionKey, submissionState);

    let matchedCategoryIds: number[] = [];
    let requestedBrandNames: string[] = [];
    let requiresInternationalFreight = false;

    if (data.items.length) {
      requestedBrandNames = data.items.map((i) => i.brand || "").filter(Boolean);
      requiresInternationalFreight = data.items.some((i) => isInternationalOrigin(i.countryOfOrigin));
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
        requiresInternationalFreight = extractedItems.some((i) => isInternationalOrigin(i.countryOfOrigin || undefined));
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
      // بند مصدره خارج السعودية يستوجب ناقلاً يقدّم شحناً دولياً وتخليصاً جمركياً فعلياً — شرط إلزامي لا اقتراحي
      const requiredLogisticsServiceIds = requiresInternationalFreight
        ? (await resolveActiveLogisticsServices(["شحن من الخارج", "تخليص جمركي"])) || []
        : [];
      const [suppliers, carriers] = await Promise.all([
        findMatchingSuppliers(categoryIds, brandIds),
        categoryIds.length || serviceAreaIds?.length || requiredLogisticsServiceIds.length
          ? findMatchingCarriers(categoryIds, serviceAreaIds || [], requiredLogisticsServiceIds)
          : Promise.resolve([]),
      ]);

      const noteParts: string[] = [];
      const aiWorkflows: Promise<unknown>[] = [];
      if (suppliers.length) {
        const supplierResult = `الموردون المقترحون بناءً على الفئات/العلامات التجارية:\n${suppliers.slice(0, 10).map(supplierMatchLine).join("\n")}`;
        noteParts.push(supplierResult);
        aiWorkflows.push(
          createAiRecommendationWorkflow({
            agentName: "Supplier Matching Agent",
            requestId,
            decisionType: "supplier_rfq",
            taskType: "supplier_matching_recommendation",
            recommendation: supplierResult,
            recipientPartnerIds: suppliers.slice(0, 10).map((supplier) => supplier.partnerId),
            confidenceScore: suppliers[0]?.score ? Math.min(0.95, suppliers[0].score / 100) : 0.5,
          })
        );
      }
      if (carriers.length) {
        const carrierResult = `وكلاء الشحن المقترحون عند الحاجة لشحن مستقل:\n${carriers.slice(0, 10).map(carrierMatchLine).join("\n")}`;
        noteParts.push(carrierResult);
        aiWorkflows.push(
          createAiRecommendationWorkflow({
            agentName: "Freight Planning Agent",
            requestId,
            decisionType: "freight_rfq",
            taskType: "freight_planning_recommendation",
            recommendation: carrierResult,
            recipientPartnerIds: carriers.slice(0, 10).map((carrier) => carrier.partnerId),
            confidenceScore: carriers[0]?.score ? Math.min(0.95, carriers[0].score / 100) : 0.5,
          })
        );
      }
      if (noteParts.length) {
        await postProcurementRequestNote(requestId, noteParts.join("\n\n"));
      }
      if (aiWorkflows.length) {
        await Promise.all(aiWorkflows);
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

    submissionState = { ...submissionState, status: "completed", trackingNumber, trackingToken, stage: "completed" };
    await saveSubmissionState(submissionKey, submissionState);
    return NextResponse.json({ ok: true, tracking_number: trackingNumber, tracking_token: trackingToken, correlation_id: correlationId });
  } catch (error) {
    try {
      await saveSubmissionState(submissionKey, {
        ...submissionState,
        status: "failed",
        requestId: createdRequestId ?? submissionState.requestId,
        stage: submissionState.stage ?? "unknown",
        error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
      });
    } catch (stateError) {
      console.error("[quotes/register] unable to record failed submission:", stateError);
    }
    if (error instanceof OdooClientError) {
      console.error(`[quotes/register][${error.correlationId}] ${error.kind}: ${error.message}`);
      const status = error.kind === "validation" ? 400 : error.kind === "conflict" ? 409 : 500;
      return NextResponse.json({ error: error.publicMessage }, { status });
    }
    console.error("Procurement request submission failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حفظ طلبكم في نظام العمليات" }, { status: 500 });
  }
}
