import { NextRequest, NextResponse } from "next/server";
import {
  sendVendorJourneyStartedEmail,
  sendVendorRejectedEmail,
  sendQuoteStatusToClient,
  getClientNotifiableStatuses,
} from "@/lib/email";
import { generateVendorOnboardingToken } from "@/lib/vendor-onboarding-token";

const WEBHOOK_SECRET = process.env.ERPNEXT_WEBHOOK_SECRET;

type SupplierPayload = {
  event: "supplier.approved" | "supplier.rejected";
  supplier_id: string;
  supplier_name: string;
  manager_name: string;
  email: string;
};

type OpportunityPayload = {
  event: "opportunity.stage_changed";
  project_name: string;
  client_name: string;
  client_email: string;
  stage: string;
};

type WebhookPayload = SupplierPayload | OpportunityPayload;

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 دقائق

export async function POST(req: NextRequest) {
  // التحقق من الـ secret
  const secret = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // حماية من Replay Attacks: رفض الطلبات خارج نافذة 5 دقائق
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
      case "supplier.approved": {
        const baseUrl = (
          process.env.NEXT_PUBLIC_APP_URL ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          "https://www.build.sa"
        ).replace(/\/$/, "");
        const token = generateVendorOnboardingToken(payload.supplier_id, payload.email);
        const locale = "/ar/register/complete";
        await sendVendorJourneyStartedEmail({
          establishment_name: payload.supplier_name,
          manager_name: payload.manager_name,
          email: payload.email,
          onboarding_url: `${baseUrl}${locale}?token=${token}`,
        });
        break;
      }

      case "supplier.rejected":
        await sendVendorRejectedEmail({
          establishment_name: payload.supplier_name,
          manager_name: payload.manager_name,
          email: payload.email,
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
