import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  OdooClientError,
  createOutboxEvent,
  getCarrierProfileForNotification,
  getProcurementRequestForNotification,
  getRequestsPendingDeclineNotification,
  getSupplierProfileForNotification,
  markRequestDeclinedForCustomer,
  read,
  searchRead,
  syncSupplierMatchingEligibility,
  write,
  type CarrierNotificationProfile,
  type ProcurementRequestNotification,
  type SupplierNotificationProfile,
} from "@/lib/odoo";
import { generateOnboardingToken } from "@/lib/vendor-onboarding-token";
import {
  sendCarrierFinalReviewNotification,
  sendCarrierFullyApprovedEmail,
  sendCarrierJourneyStartedEmail,
  sendCarrierMoreInfoRequestedEmail,
  sendCarrierReactivatedEmail,
  sendCarrierRegistrationConfirmation,
  sendCarrierRejectedEmail,
  sendCarrierSuspendedEmail,
  sendInternalNewProcurementRequestNotification,
  sendProcurementRequestDeclinedEmail,
  sendProcurementRequestReceivedEmail,
  sendSupplierFinalReviewNotification,
  sendVendorFullyApprovedEmail,
  sendVendorJourneyStartedEmail,
  sendVendorMoreInfoRequestedEmail,
  sendVendorReactivatedEmail,
  sendVendorRegistrationConfirmation,
  sendVendorRejectedEmail,
  sendVendorSuspendedEmail,
} from "@/lib/email";

export const maxDuration = 60;

const BATCH_SIZE = 20;
const LOCK_DURATION_MS = 5 * 60 * 1000;
// على Production نستخدم النطاق الرسمي دائماً؛ على Preview/local نربط الرابط بنفس النشر الحالي
// حتى لا يصل بريد اختباري يشير لبيانات Production بينما الكود الفعلي يعمل على بيئة أخرى
const BASE_URL = (
  process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.build.sa"
).replace(/\/$/, "");

type OutboxRow = {
  id: number;
  x_studio_event_type: string;
  x_studio_resource_id: number;
  x_studio_supplier_profile_id: [number, string] | false;
  x_studio_carrier_profile_id: [number, string] | false;
  x_studio_procurement_request_id: [number, string] | false;
  x_studio_attempts: number;
  x_studio_max_attempts: number;
};

function onboardingUrl(
  kind: "supplier" | "carrier",
  profileId: number,
  partnerId: number,
  tokenVersion: number,
  lang: "ar" | "en"
): string {
  const token = generateOnboardingToken(profileId, partnerId, tokenVersion, kind);
  const base = kind === "supplier" ? "register" : "carriers/register";
  // العربي على /ar (مجموعة locale)، الإنجليزي بلا بادئة (مجموعة (site))
  const path = lang === "ar" ? `/ar/${base}/complete` : `/${base}/complete`;
  return `${BASE_URL}${path}?token=${token}`;
}

function procurementTrackingUrl(trackingToken: string): string {
  return `${BASE_URL}/ar/track-request?token=${trackingToken}`;
}

async function dispatchProcurementEvent(eventType: string, req: ProcurementRequestNotification, trackingToken: string): Promise<void> {
  switch (eventType) {
    case "procurement.request_received":
      await sendProcurementRequestReceivedEmail({
        contactName: req.contactName,
        email: req.email,
        trackingNumber: req.trackingNumber,
        trackingUrl: procurementTrackingUrl(trackingToken),
      });
      await sendInternalNewProcurementRequestNotification({
        id: req.id,
        contactName: req.contactName,
        email: req.email,
        phone: req.phone,
        projectName: req.projectName,
        deliveryMapUrl:
          req.deliveryLatitude !== null && req.deliveryLongitude !== null
            ? `https://www.google.com/maps?q=${req.deliveryLatitude},${req.deliveryLongitude}`
            : "",
        description: req.description,
        trackingNumber: req.trackingNumber,
      });
      return;
    case "procurement.request_declined":
      await sendProcurementRequestDeclinedEmail({
        contactName: req.contactName,
        email: req.email,
        trackingNumber: req.trackingNumber,
        trackingUrl: procurementTrackingUrl(trackingToken),
        declineReason: req.declineReason,
      });
      return;
    default:
      throw new Error(`unknown event type: ${eventType}`);
  }
}

async function dispatchSupplierEvent(eventType: string, profile: SupplierNotificationProfile): Promise<void> {
  const lang = profile.preferredLanguage;
  switch (eventType) {
    case "supplier.pre_registered":
      await sendVendorRegistrationConfirmation({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        lang,
      });
      return;
    case "supplier.preliminary_approved":
      await sendVendorJourneyStartedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        onboarding_url: onboardingUrl("supplier", profile.id, profile.partnerId, profile.tokenVersion, lang),
        lang,
      });
      return;
    case "supplier.preliminary_more_information_required":
      await sendVendorMoreInfoRequestedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        requestedInfo: profile.missingInfoRequested,
        lang,
      });
      return;
    case "supplier.preliminary_rejected":
      await sendVendorRejectedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        reason: profile.rejectionReasonExternal,
        lang,
      });
      return;
    case "supplier.profile_submitted_final_review":
      await sendSupplierFinalReviewNotification({
        profileId: profile.id,
        establishment_name: profile.establishmentName,
        email: profile.email,
      });
      return;
    case "supplier.fully_approved":
      await sendVendorFullyApprovedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        lang,
      });
      return;
    case "supplier.final_more_information_required":
      await sendVendorMoreInfoRequestedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        requestedInfo: profile.finalMoreInfoRequested,
        onboardingUrl: onboardingUrl("supplier", profile.id, profile.partnerId, profile.tokenVersion, lang),
        lang,
      });
      return;
    case "supplier.finally_rejected":
      await sendVendorRejectedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        reason: profile.rejectionReasonExternal,
        lang,
      });
      return;
    case "supplier.suspended":
      await sendVendorSuspendedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        reason: profile.suspendedReason,
        lang,
      });
      return;
    case "supplier.reactivated":
      await sendVendorReactivatedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        lang,
      });
      return;
    default:
      throw new Error(`unknown event type: ${eventType}`);
  }
}

async function dispatchCarrierEvent(eventType: string, profile: CarrierNotificationProfile): Promise<void> {
  const lang = profile.preferredLanguage;
  switch (eventType) {
    case "carrier.pre_registered":
      await sendCarrierRegistrationConfirmation({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        lang,
      });
      return;
    case "carrier.preliminary_approved":
      await sendCarrierJourneyStartedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        onboarding_url: onboardingUrl("carrier", profile.id, profile.partnerId, profile.tokenVersion, lang),
        lang,
      });
      return;
    case "carrier.preliminary_more_information_required":
      await sendCarrierMoreInfoRequestedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        requestedInfo: profile.missingInfoRequested,
        lang,
      });
      return;
    case "carrier.preliminary_rejected":
      await sendCarrierRejectedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        reason: profile.rejectionReasonExternal,
        lang,
      });
      return;
    case "carrier.profile_submitted_final_review":
      await sendCarrierFinalReviewNotification({
        profileId: profile.id,
        establishment_name: profile.establishmentName,
        email: profile.email,
      });
      return;
    case "carrier.fully_approved":
      await sendCarrierFullyApprovedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        lang,
      });
      return;
    case "carrier.final_more_information_required":
      await sendCarrierMoreInfoRequestedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        requestedInfo: profile.finalMoreInfoRequested,
        onboardingUrl: onboardingUrl("carrier", profile.id, profile.partnerId, profile.tokenVersion, lang),
        lang,
      });
      return;
    case "carrier.finally_rejected":
      await sendCarrierRejectedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        reason: profile.rejectionReasonExternal,
        lang,
      });
      return;
    case "carrier.suspended":
      await sendCarrierSuspendedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        reason: profile.suspendedReason,
        lang,
      });
      return;
    case "carrier.reactivated":
      await sendCarrierReactivatedEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        lang,
      });
      return;
    default:
      throw new Error(`unknown event type: ${eventType}`);
  }
}

/** يرمي خطأً وصفياً عند الفشل — يُحدَّد المسار (مورد/ناقل) من الحقل المربوط بالحدث */
async function dispatchEvent(row: OutboxRow): Promise<void> {
  if (row.x_studio_procurement_request_id) {
    const requestId = row.x_studio_procurement_request_id[0];
    const reqData = await getProcurementRequestForNotification(requestId);
    if (!reqData) throw new Error(`procurement request ${requestId} not found or has no email`);
    const tokenRows = await read<{ x_studio_tracking_token: string | false }>(
      "x_build_procurement_request",
      [requestId],
      ["x_studio_tracking_token"]
    );
    const trackingToken = tokenRows[0]?.x_studio_tracking_token || "";
    return dispatchProcurementEvent(row.x_studio_event_type, reqData, trackingToken);
  }

  if (row.x_studio_carrier_profile_id) {
    const profileId = row.x_studio_carrier_profile_id[0];
    const profile = await getCarrierProfileForNotification(profileId);
    if (!profile) throw new Error(`carrier profile ${profileId} not found or has no email`);
    return dispatchCarrierEvent(row.x_studio_event_type, profile);
  }

  const profileId = row.x_studio_supplier_profile_id ? row.x_studio_supplier_profile_id[0] : row.x_studio_resource_id;
  const profile = await getSupplierProfileForNotification(profileId);
  if (!profile) throw new Error(`supplier profile ${profileId} not found or has no email`);
  return dispatchSupplierEvent(row.x_studio_event_type, profile);
}

function backoffMinutes(attempts: number): number {
  return Math.min(2 ** attempts, 60); // 2, 4, 8, 16, 32, 60 دقيقة كحد أقصى
}

function toOdooDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/** يلتقط طلبات وضعها الفريق "مرفوض" يدوياً من واجهة أودو (لا من موقعنا) — ينشئ حدث إشعار للعميل ويثبّت الحالة الظاهرة له */
async function syncDeclinedRequests(): Promise<number> {
  const pending = await getRequestsPendingDeclineNotification();
  let synced = 0;
  for (const request of pending) {
    try {
      await createOutboxEvent({
        eventType: "procurement.request_declined",
        resourceModel: "x_build_procurement_request",
        resourceId: request.id,
        procurementRequestId: request.id,
        idempotencyKey: `procurement.request_declined:${request.id}`,
        payload: { request_id: request.id },
      });
      await markRequestDeclinedForCustomer(request.id);
      synced += 1;
    } catch (error) {
      console.error(`[cron/odoo-outbox] failed to sync decline for request ${request.id}:`, error instanceof Error ? error.message : error);
    }
  }
  return synced;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = randomUUID();
  const now = new Date();
  const nowStr = toOdooDatetime(now);

  let declinedSynced = 0;
  try {
    declinedSynced = await syncDeclinedRequests();
  } catch (error) {
    console.error("[cron/odoo-outbox] syncDeclinedRequests failed:", error instanceof Error ? error.message : error);
  }

  let eligibilitySynced = { enabled: 0, disabled: 0 };
  try {
    eligibilitySynced = await syncSupplierMatchingEligibility();
  } catch (error) {
    console.error("[cron/odoo-outbox] syncSupplierMatchingEligibility failed:", error instanceof Error ? error.message : error);
  }

  let candidates: OutboxRow[];
  try {
    candidates = await searchRead<OutboxRow>(
      "x_build_integration_outbox",
      [
        "&",
        "|",
        ["x_studio_status", "=", "pending"],
        "&",
        ["x_studio_status", "=", "processing"],
        ["x_studio_lock_expires_at", "<", nowStr],
        "|",
        ["x_studio_available_at", "=", false],
        ["x_studio_available_at", "<=", nowStr],
      ],
      ["x_studio_event_type", "x_studio_resource_id", "x_studio_supplier_profile_id", "x_studio_carrier_profile_id", "x_studio_procurement_request_id", "x_studio_attempts", "x_studio_max_attempts"],
      { limit: BATCH_SIZE, order: "id asc" }
    );
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[cron/odoo-outbox][${error.correlationId}] failed to fetch batch: ${error.message}`);
    }
    return NextResponse.json({ error: "تعذر جلب دفعة الأحداث" }, { status: 500 });
  }

  const results = { processed: 0, sent: 0, retried: 0, dead_letter: 0, skipped: 0 };

  for (const row of candidates) {
    // قفل تفاؤلي: تحقّق أن الحدث ما زال بحالة قابلة للمعالجة قبل الادّعاء به (يقلل تصادم التشغيل المتزامن)
    const freshRows = await read<{ x_studio_status: string }>("x_build_integration_outbox", [row.id], ["x_studio_status"]);
    if (!freshRows[0] || !["pending", "processing"].includes(freshRows[0].x_studio_status)) {
      results.skipped += 1;
      continue;
    }

    const attempts = (row.x_studio_attempts || 0) + 1;
    await write("x_build_integration_outbox", [row.id], {
      x_studio_status: "processing",
      x_studio_locked_by: runId,
      x_studio_locked_at: nowStr,
      x_studio_lock_expires_at: toOdooDatetime(new Date(now.getTime() + LOCK_DURATION_MS)),
      x_studio_attempts: attempts,
    });

    results.processed += 1;

    try {
      await dispatchEvent(row);
      await write("x_build_integration_outbox", [row.id], {
        x_studio_status: "sent",
        x_studio_processed_at: toOdooDatetime(new Date()),
        x_studio_last_error: false,
      });
      results.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const maxAttempts = row.x_studio_max_attempts || 5;
      if (attempts >= maxAttempts) {
        await write("x_build_integration_outbox", [row.id], {
          x_studio_status: "dead_letter",
          x_studio_last_error: message.slice(0, 2000),
        });
        results.dead_letter += 1;
        console.error(`[cron/odoo-outbox] event ${row.id} (${row.x_studio_event_type}) moved to dead_letter: ${message}`);
      } else {
        await write("x_build_integration_outbox", [row.id], {
          x_studio_status: "pending",
          x_studio_available_at: toOdooDatetime(new Date(Date.now() + backoffMinutes(attempts) * 60 * 1000)),
          x_studio_last_error: message.slice(0, 2000),
        });
        results.retried += 1;
        console.error(`[cron/odoo-outbox] event ${row.id} (${row.x_studio_event_type}) attempt ${attempts} failed: ${message}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    run_id: runId,
    declined_synced: declinedSynced,
    eligibility_enabled: eligibilitySynced.enabled,
    eligibility_disabled: eligibilitySynced.disabled,
    ...results,
  });
}
