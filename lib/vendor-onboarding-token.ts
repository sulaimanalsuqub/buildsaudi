import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 يوماً
const PURPOSE = "vendor_onboarding";

function getSecret(): string {
  const secret = process.env.VENDOR_ONBOARDING_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("VENDOR_ONBOARDING_TOKEN_SECRET is required in production");
    }
    return "build-vendor-onboarding-dev-only";
  }
  return secret;
}

type TokenPayload = {
  profileId: number;
  partnerId: number;
  purpose: string;
  issuedAt: number;
  expiresAt: number;
  tokenVersion: number;
  nonce: string;
};

function sign(payloadJson: string): string {
  return createHmac("sha256", getSecret()).update(payloadJson).digest("hex").slice(0, 32);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** التوكن لا يحتوي إلا معرّفات + بيانات دورة حياة الرابط — لا CR/VAT/IBAN/ملاحظات داخلية إطلاقاً */
export function generateOnboardingToken(profileId: number, partnerId: number, tokenVersion: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    profileId,
    partnerId,
    purpose: PURPOSE,
    issuedAt: now,
    expiresAt: now + MAX_AGE_SECONDS,
    tokenVersion,
    nonce: randomBytes(8).toString("hex"),
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString("base64url");
  const sig = sign(payloadJson);
  return `${payloadB64}.${sig}`;
}

export type OnboardingTokenVerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: "malformed" | "expired" | "bad_signature" | "wrong_purpose" };

/** تحقق ذاتي من الشكل والتوقيع والانتهاء — لا يتحقق من tokenVersion الحالي (ذاك يحتاج قراءة Odoo، يتم في مستدعي الدالة) */
export function verifyOnboardingTokenStructure(token: string): OnboardingTokenVerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, sig] = parts;

  let payload: TokenPayload;
  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    payload = JSON.parse(payloadJson);
    const expectedSig = sign(payloadJson);
    if (!safeEqual(expectedSig, sig)) return { ok: false, reason: "bad_signature" };
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.purpose !== PURPOSE) return { ok: false, reason: "wrong_purpose" };

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds > payload.expiresAt) return { ok: false, reason: "expired" };

  return { ok: true, payload };
}
