import { NextRequest, NextResponse } from "next/server";
import { sendContractSignLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await sendContractSignLink(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (contract-sign):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
