import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOTP, verifyOTP, generateVerifiedToken } from "@/lib/otp";
import { sendEmailVerificationOTP } from "@/lib/email";
import { rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { checkSharedRateLimit } from "@/lib/shared-store";

const emailField = z.string().trim().toLowerCase().email();

const sendSchema = z.object({
  email: emailField,
  action: z.literal("send"),
});

const verifySchema = z.object({
  email: emailField,
  code: z.string().length(6),
  action: z.literal("verify"),
});

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  if (body.action === "send") {
    let limited: { ok: boolean; resetAt: number };
    try { limited = await checkSharedRateLimit(`otp-send:${clientId}`, 5, 60 * 60); }
    catch { return NextResponse.json({ error: "خدمة الحماية غير متاحة؛ حاول لاحقاً" }, { status: 503 }); }
    const { ok, resetAt } = limited;
    if (!ok) return rateLimitError(resetAt, "OTP");

    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بريد إلكتروني غير صحيح" }, { status: 400 });
    }

    const code = generateOTP(parsed.data.email);
    try {
      await sendEmailVerificationOTP({ email: parsed.data.email, code });
    } catch {
      return NextResponse.json({ error: "فشل إرسال رمز التحقق. حاول مجدداً." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "verify") {
    let limited: { ok: boolean; resetAt: number };
    try { limited = await checkSharedRateLimit(`otp-verify:${clientId}`, 10, 15 * 60); }
    catch { return NextResponse.json({ error: "خدمة الحماية غير متاحة؛ حاول لاحقاً" }, { status: 503 }); }
    const { ok, resetAt } = limited;
    if (!ok) return rateLimitError(resetAt, "OTP");

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    const valid = verifyOTP(parsed.data.email, parsed.data.code);
    if (!valid) {
      return NextResponse.json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    }

    const token = generateVerifiedToken(parsed.data.email);
    return NextResponse.json({ ok: true, token });
  }

  return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });
}
