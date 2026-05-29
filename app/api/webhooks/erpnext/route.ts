import { NextRequest, NextResponse } from "next/server";
import {
  sendVendorActivatedEmail,
  sendVendorRejectedEmail,
  sendQuoteStatusToClient,
  getClientNotifiableStatuses,
} from "@/lib/email";

const WEBHOOK_SECRET = process.env.ERPNEXT_WEBHOOK_SECRET;

type SupplierPayload = {
  event: "supplier.approved" | "supplier.rejected";
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

export async function POST(req: NextRequest) {
  // Verify shared secret
  const secret = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (payload.event) {
      case "supplier.approved":
        await sendVendorActivatedEmail({
          establishment_name: payload.supplier_name,
          manager_name: payload.manager_name,
          email: payload.email,
        });
        break;

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
