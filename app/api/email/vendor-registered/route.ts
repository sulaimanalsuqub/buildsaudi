import { NextRequest, NextResponse } from "next/server";
import { sendVendorRegistrationConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await sendVendorRegistrationConfirmation(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (vendor-registered):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
