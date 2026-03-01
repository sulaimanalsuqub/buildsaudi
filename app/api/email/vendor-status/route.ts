import { NextRequest, NextResponse } from "next/server";
import { sendVendorActivatedEmail, sendVendorRejectedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { action, vendor } = await req.json();
    if (action === "activated") {
      await sendVendorActivatedEmail(vendor);
    } else if (action === "rejected") {
      await sendVendorRejectedEmail(vendor);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (vendor-status):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
