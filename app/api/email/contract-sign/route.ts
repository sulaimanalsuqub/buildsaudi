import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendContractSignLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    await sendContractSignLink(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error (contract-sign):", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
