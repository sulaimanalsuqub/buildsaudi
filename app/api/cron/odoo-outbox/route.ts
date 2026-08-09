import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  OdooClientError,
  checkAndTriggerCustomerOffer,
  createOutboxEvent,
  getCustomerOfferEmailData,
  getDraftAiCommunications,
  getPartnerRfqRecipient,
  getPendingAiApprovalDecisions,
  getPendingCustomerOfferDecisions,
  getPendingWinnerSelectionDecisions,
  getCarrierProfileForNotification,
  getProcurementRfqDetails,
  getProcurementRequestForNotification,
  getRequestsPendingDeclineNotification,
  getSupplierProfileForNotification,
  markAiApprovalApproved,
  markAiApprovalRejected,
  markAiCommunicationSent,
  markCustomerOfferApproved,
  markCustomerOfferRejected,
  markRequestDeclinedForCustomer,
  markWinnerSelectionApproved,
  markWinnerSelectionRejected,
  read,
  searchRead,
  syncSupplierMatchingEligibility,
  write,
  type CarrierNotificationProfile,
  type ProcurementRequestNotification,
  type SupplierNotificationProfile,
} from "@/lib/odoo";
import { generateOnboardingToken } from "@/lib/vendor-onboarding-token";
import { claimSubmission, saveSubmissionState } from "@/lib/shared-store";
import { verifyBearerSecret } from "@/lib/bearer-auth";
import {
  sendCarrierFinalReviewNotification,
  sendCarrierFullyApprovedEmail,
  sendCarrierJourneyStartedEmail,
  sendCarrierMoreInfoRequestedEmail,
  sendCarrierReactivatedEmail,
  sendCarrierRegistrationConfirmation,
  sendCarrierRejectedEmail,
  sendCarrierRfqRequestEmail,
  sendCarrierSuspendedEmail,
  sendCustomerQuoteEmail,
  sendInternalNewProcurementRequestNotification,
  sendOpsAlertEmail,
  sendProcurementRequestDeclinedEmail,
  sendProcurementRequestReceivedEmail,
  sendSupplierRfqRequestEmail,
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

function resendMessageId(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const data = "data" in result ? (result as { data?: unknown }).data : undefined;
  if (!data || typeof data !== "object") return undefined;
  const id = "id" in data ? (data as { id?: unknown }).id : undefined;
  return typeof id === "string" ? id : undefined;
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

async function syncApprovedAiRfqs(): Promise<{ approved: number; rejected: number; emailsSent: number; missingRecipients: number }> {
  const decisions = await getPendingAiApprovalDecisions();
  const results = { approved: 0, rejected: 0, emailsSent: 0, missingRecipients: 0 };

  for (const decision of decisions) {
    if (decision.approvalStatus === "refused") {
      await markAiApprovalRejected(decision);
      results.rejected += 1;
      continue;
    }

    const request = await getProcurementRfqDetails(decision.requestId);
    if (!request) {
      results.missingRecipients += 1;
      continue;
    }

    const communications = await getDraftAiCommunications(decision.requestId, decision.agentId);
    for (const communication of communications) {
      if (!communication.correlation) {
        // Do not send an RFQ that cannot later be associated unambiguously.
        await sendOpsAlertEmail({
          subject: "تم منع إرسال RFQ بلا رمز ارتباط فريد",
          details: [{ label: "معرف الاتصال", value: String(communication.id) }, { label: "معرف الطلب", value: String(decision.requestId) }],
        }).catch(() => undefined);
        results.missingRecipients += 1;
        continue;
      }
      const recipient = await getPartnerRfqRecipient(communication.partnerId);
      if (!recipient) {
        results.missingRecipients += 1;
        continue;
      }

      const sendResult =
        decision.decisionType === "supplier_rfq"
          ? await sendSupplierRfqRequestEmail({
              supplierName: recipient.name,
              email: recipient.email,
              projectName: request.projectName,
              trackingNumber: request.trackingNumber,
              correlation: communication.correlation,
              description: request.description,
              lines: request.lines,
            })
          : await sendCarrierRfqRequestEmail({
              carrierName: recipient.name,
              email: recipient.email,
              projectName: request.projectName,
              trackingNumber: request.trackingNumber,
              correlation: communication.correlation,
              description: request.description,
              lines: request.lines,
            });

      await markAiCommunicationSent(communication.id, resendMessageId(sendResult));
      results.emailsSent += 1;
    }

    await markAiApprovalApproved(decision);
    results.approved += 1;
  }

  return results;
}

async function syncWinnerSelections(): Promise<{ approved: number; rejected: number }> {
  const decisions = await getPendingWinnerSelectionDecisions();
  const results = { approved: 0, rejected: 0 };

  for (const decision of decisions) {
    if (decision.approvalStatus === "refused") {
      await markWinnerSelectionRejected(decision);
      results.rejected += 1;
      continue;
    }
    await markWinnerSelectionApproved(decision);
    results.approved += 1;

    // بعد اعتماد فائز، افحص جاهزية عرض العميل (مورد فائز + ناقل فائز إن وُجدت جولة شحن) — best effort
    try {
      await checkAndTriggerCustomerOffer(decision.requestId);
    } catch (error) {
      console.error("[cron/odoo-outbox] checkAndTriggerCustomerOffer failed (non-blocking):", error instanceof Error ? error.message : error);
    }
  }

  return results;
}

/** يلتقط قرارات "إرسال عرض العميل" المعتمَدة/المرفوضة من أودو — عند الاعتماد يرسل عرض السعر فعلياً لبريد العميل */
async function syncCustomerOffers(): Promise<{ approved: number; rejected: number; emailsSent: number; missingRecipients: number }> {
  const decisions = await getPendingCustomerOfferDecisions();
  const results = { approved: 0, rejected: 0, emailsSent: 0, missingRecipients: 0 };

  for (const decision of decisions) {
    if (decision.approvalStatus === "refused") {
      await markCustomerOfferRejected(decision);
      results.rejected += 1;
      continue;
    }

    const offer = await getCustomerOfferEmailData(decision.requestId);
    if (!offer) {
      results.missingRecipients += 1;
      continue;
    }

    await sendCustomerQuoteEmail({
      contactName: offer.contactName,
      email: offer.email,
      trackingNumber: offer.trackingNumber,
      trackingUrl: procurementTrackingUrl(offer.trackingToken),
      projectName: offer.projectName,
      salePrice: offer.salePrice,
      leadTimeDays: offer.leadTimeDays,
      validityDays: offer.validityDays,
    });
    results.emailsSent += 1;

    await markCustomerOfferApproved(decision);
    results.approved += 1;
  }

  return results;
}

export async function GET(req: NextRequest) {
  if (!verifyBearerSecret(req.headers.get("authorization"), process.env.CRON_SECRET)) {
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

  let aiRfqsSynced = { approved: 0, rejected: 0, emailsSent: 0, missingRecipients: 0 };
  try {
    aiRfqsSynced = await syncApprovedAiRfqs();
  } catch (error) {
    console.error("[cron/odoo-outbox] syncApprovedAiRfqs failed:", error instanceof Error ? error.message : error);
  }

  let winnerSelectionsSynced = { approved: 0, rejected: 0 };
  try {
    winnerSelectionsSynced = await syncWinnerSelections();
  } catch (error) {
    console.error("[cron/odoo-outbox] syncWinnerSelections failed:", error instanceof Error ? error.message : error);
  }

  let customerOffersSynced = { approved: 0, rejected: 0, emailsSent: 0, missingRecipients: 0 };
  try {
    customerOffersSynced = await syncCustomerOffers();
  } catch (error) {
    console.error("[cron/odoo-outbox] syncCustomerOffers failed:", error instanceof Error ? error.message : error);
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
    const dispatchKey = `outbox-dispatch:${row.id}`;
    const dispatchInitial = { status: "processing" as const, operation: "outbox_dispatch" as const, submissionId: dispatchKey, correlationId: runId, stage: "dispatching_outbox" };
    // الادّعاء بالحدث (claimSubmission) يعتمد على Redis المشترك — لو غاب/فشل مؤقتاً لا نريد أن
    // يُسقط ذلك التشغيلة كلها (بقية الدفعة)، بل نتخطى هذا الحدث فقط ويُعاد المحاولة بالتشغيلة التالية.
    let dispatchClaim: Awaited<ReturnType<typeof claimSubmission>>;
    try {
      dispatchClaim = await claimSubmission(dispatchKey, dispatchInitial);
    } catch (error) {
      console.error(`[cron/odoo-outbox] claimSubmission unavailable for event ${row.id}, skipping this run:`, error instanceof Error ? error.message : error);
      results.skipped += 1;
      continue;
    }
    if (!dispatchClaim.claimed) {
      // A completed dispatch may have crashed before the Odoo status update. Leave it
      // visible for reconciliation rather than re-sending an email side effect.
      results.skipped += 1;
      continue;
    }
    // قفل تفاؤلي: تحقّق أن الحدث ما زال بحالة قابلة للمعالجة قبل الادّعاء به (يقلل تصادم التشغيل المتزامن)
    const freshRows = await read<{ x_studio_status: string }>("x_build_integration_outbox", [row.id], ["x_studio_status"]);
    if (!freshRows[0] || !["pending", "processing"].includes(freshRows[0].x_studio_status)) {
      await saveSubmissionState(dispatchKey, { ...dispatchInitial, status: "completed", stage: "outbox_not_dispatchable" }).catch(() => undefined);
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
      await saveSubmissionState(dispatchKey, { ...dispatchInitial, status: "completed", requestId: row.id, stage: "outbox_sent" });
      results.sent += 1;
    } catch (error) {
      await saveSubmissionState(dispatchKey, { ...dispatchInitial, status: "failed", stage: "outbox_dispatch_failed", error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) }).catch(() => undefined);
      const message = error instanceof Error ? error.message : String(error);
      const maxAttempts = row.x_studio_max_attempts || 5;
      if (attempts >= maxAttempts) {
        await write("x_build_integration_outbox", [row.id], {
          x_studio_status: "dead_letter",
          x_studio_last_error: message.slice(0, 2000),
        });
        results.dead_letter += 1;
        console.error(`[cron/odoo-outbox] event ${row.id} (${row.x_studio_event_type}) moved to dead_letter: ${message}`);
        // dead_letter يحدث مرة واحدة لكل حدث (لا تكرار تنبيهات) — لو كان الفشل بسبب Resend نفسه فالتنبيه سيفشل أيضاً، يبقى الأثر في x_studio_last_error بأودو
        await sendOpsAlertEmail({
          subject: `حدث بريد استنفد محاولاته (dead-letter) — ${row.x_studio_event_type}`,
          details: [
            { label: "معرف الحدث", value: String(row.id) },
            { label: "نوع الحدث", value: row.x_studio_event_type },
            { label: "المحاولات", value: String(attempts) },
            { label: "آخر خطأ", value: message.slice(0, 300) },
          ],
        }).catch((alertError) =>
          console.error(`[cron/odoo-outbox] dead_letter ops alert failed:`, alertError instanceof Error ? alertError.message : alertError)
        );
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
    ai_rfq_approvals_synced: aiRfqsSynced.approved,
    ai_rfq_approvals_rejected: aiRfqsSynced.rejected,
    ai_rfq_emails_sent: aiRfqsSynced.emailsSent,
    ai_rfq_missing_recipients: aiRfqsSynced.missingRecipients,
    winner_selections_approved: winnerSelectionsSynced.approved,
    winner_selections_rejected: winnerSelectionsSynced.rejected,
    customer_offers_approved: customerOffersSynced.approved,
    customer_offers_rejected: customerOffersSynced.rejected,
    customer_offer_emails_sent: customerOffersSynced.emailsSent,
    customer_offer_missing_recipients: customerOffersSynced.missingRecipients,
    ...results,
  });
}
