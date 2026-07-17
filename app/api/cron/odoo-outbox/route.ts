import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  OdooClientError,
  getSupplierProfileForNotification,
  read,
  searchRead,
  write,
} from "@/lib/odoo";
import { generateOnboardingToken } from "@/lib/vendor-onboarding-token";
import {
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
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.build.sa").replace(/\/$/, "");

type OutboxRow = {
  id: number;
  x_studio_event_type: string;
  x_studio_resource_id: number;
  x_studio_supplier_profile_id: [number, string] | false;
  x_studio_attempts: number;
  x_studio_max_attempts: number;
};

function onboardingUrl(profileId: number, partnerId: number, tokenVersion: number, lang: "ar" | "en"): string {
  const token = generateOnboardingToken(profileId, partnerId, tokenVersion);
  // العربي على /ar (مجموعة locale)، الإنجليزي بلا بادئة (مجموعة (site))
  const path = lang === "ar" ? "/ar/register/complete" : "/register/complete";
  return `${BASE_URL}${path}?token=${token}`;
}

/** يُرجع true إذا أُرسل الحدث بنجاح؛ يرمي خطأً وصفياً عند الفشل */
async function dispatchEvent(row: OutboxRow): Promise<void> {
  const profileId = row.x_studio_supplier_profile_id ? row.x_studio_supplier_profile_id[0] : row.x_studio_resource_id;
  const profile = await getSupplierProfileForNotification(profileId);
  if (!profile) {
    throw new Error(`supplier profile ${profileId} not found or has no email`);
  }
  const lang = profile.preferredLanguage;

  switch (row.x_studio_event_type) {
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
        onboarding_url: onboardingUrl(profile.id, profile.partnerId, profile.tokenVersion, lang),
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
        onboardingUrl: onboardingUrl(profile.id, profile.partnerId, profile.tokenVersion, lang),
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
      // نوع حدث غير معروف — لا نُعيد المحاولة إلى ما لا نهاية، نُسقطه في Dead Letter مباشرة عبر رمي خطأ غير قابل للتراجع
      throw new Error(`unknown event type: ${row.x_studio_event_type}`);
  }
}

function backoffMinutes(attempts: number): number {
  return Math.min(2 ** attempts, 60); // 2, 4, 8, 16, 32, 60 دقيقة كحد أقصى
}

function toOdooDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
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
      ["x_studio_event_type", "x_studio_resource_id", "x_studio_supplier_profile_id", "x_studio_attempts", "x_studio_max_attempts"],
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

  return NextResponse.json({ ok: true, run_id: runId, ...results });
}
