import { NextRequest, NextResponse } from "next/server";
import {
  sendVendorJourneyStartedEmail,
  sendVendorFullyApprovedEmail,
  sendVendorRejectedEmail,
  sendQuoteStatusToClient,
  getClientNotifiableStatuses,
} from "@/lib/email";
import { generateVendorOnboardingToken } from "@/lib/vendor-onboarding-token";

const WEBHOOK_SECRET = process.env.ERPNEXT_WEBHOOK_SECRET;

type SupplierInvitePayload = {
  event: "supplier.approved";
  supplier_id: string;
  supplier_name: string;
  manager_name: string;
  email: string;
  /** 0 | 1 | "" — إن وُجد 1 نتجاهل (اعتماد نهائي يُعالَج بحدث منفصل) */
  profile_completed?: number | string | boolean;
};

type SupplierFullyApprovedPayload = {
  event: "supplier.fully_approved";
  supplier_id?: string;
  supplier_name: string;
  manager_name: string;
  email: string;
};

type SupplierRejectedPayload = {
  event: "supplier.rejected";
  supplier_id?: string;
  supplier_name: string;
  manager_name: string;
  email: string;
  rejection_reason?: string;
};

type OpportunityPayload = {
  event: "opportunity.stage_changed";
  project_name: string;
  client_name: string;
  client_email: string;
  stage: string;
};

type WebhookPayload =
  | SupplierInvitePayload
  | SupplierFullyApprovedPayload
  | SupplierRejectedPayload
  | OpportunityPayload;

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 دقائق

function isTruthyFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }
  return false;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tsHeader = req.headers.get("x-webhook-timestamp");
  if (tsHeader) {
    const ts = Number(tsHeader);
    const age = Date.now() - ts;
    if (isNaN(age) || age > REPLAY_WINDOW_MS || age < -30_000) {
      console.warn("[Webhook] Rejected — timestamp out of range:", tsHeader);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (payload.event) {
      // موافقة أولية فقط: أرسل رابط إكمال الملف
      case "supplier.approved": {
        if (!payload.email || !payload.supplier_id) {
          return NextResponse.json({ ok: true, skipped: true, reason: "missing email or supplier_id" });
        }
        // دفاع إضافي إن وصل webhook قديم بدون شرط profile_completed
        if (isTruthyFlag(payload.profile_completed)) {
          return NextResponse.json({
            ok: true,
            skipped: true,
            reason: "profile already completed — use supplier.fully_approved",
          });
        }

        const baseUrl = (
          process.env.NEXT_PUBLIC_APP_URL ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          "https://www.build.sa"
        ).replace(/\/$/, "");
        const token = generateVendorOnboardingToken(payload.supplier_id, payload.email);
        await sendVendorJourneyStartedEmail({
          establishment_name: payload.supplier_name,
          manager_name: payload.manager_name || payload.supplier_name,
          email: payload.email,
          onboarding_url: `${baseUrl}/ar/register/complete?token=${token}`,
        });
        break;
      }

      // اعتماد نهائي بعد اكتمال الملف — بدون رابط إكمال
      case "supplier.fully_approved": {
        if (!payload.email) {
          return NextResponse.json({ ok: true, skipped: true, reason: "no email" });
        }
        await sendVendorFullyApprovedEmail({
          establishment_name: payload.supplier_name,
          manager_name: payload.manager_name || payload.supplier_name,
          email: payload.email,
        });
        break;
      }

      case "supplier.rejected":
        if (!payload.email) {
          return NextResponse.json({ ok: true, skipped: true, reason: "no email" });
        }
        await sendVendorRejectedEmail({
          establishment_name: payload.supplier_name,
          manager_name: payload.manager_name || payload.supplier_name,
          email: payload.email,
          reason: payload.rejection_reason,
        });
        break;

      case "opportunity.stage_changed": {
        const notifiable = getClientNotifiableStatuses();
        if (!notifiable.includes(payload.stage)) {
          return NextResponse.json({ ok: true, skipped: true });
        }
        if (!payload.client_email) {
          return NextResponse.json({ ok: true, skipped: true, reason: "no email" });
        }
        await sendQuoteStatusToClient({
          client_name: payload.client_name,
          client_email: payload.client_email,
          project_name: payload.project_name,
          status: payload.stage,
        });
        break;
      }

      default:
        return NextResponse.json({ ok: true, skipped: true });
    }
  } catch (error) {
    console.error("Webhook email dispatch failed:", error);
    return NextResponse.json({ error: "Email dispatch failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
