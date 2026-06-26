import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 days

function getSecret(): string {
  const secret = process.env.OTP_SECRET ?? process.env.ERPNEXT_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("OTP_SECRET is required in production");
    }
    return "build-otp-dev-only";
  }
  return secret;
}

function sign(supplierName: string, email: string, exp: number): string {
  return createHmac("sha256", getSecret())
    .update(`vendor-onboard:${supplierName}:${email.toLowerCase().trim()}:${exp}`)
    .digest("hex")
    .slice(0, 24);
}

export function generateVendorOnboardingToken(supplierName: string, email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const sig = sign(supplierName, email, exp);
  return `${encodeURIComponent(supplierName)}.${exp}.${sig}`;
}

export function verifyVendorOnboardingToken(
  supplierName: string,
  email: string,
  token: string
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const name = decodeURIComponent(parts[0]);
  const exp = parseInt(parts[1], 10);
  if (isNaN(exp) || name !== supplierName) return false;
  const age = exp - Math.floor(Date.now() / 1000);
  if (age < 0) return false;
  const expected = sign(supplierName, email, exp);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]));
  } catch {
    return false;
  }
}

export function parseVendorOnboardingToken(token: string): { supplierName: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const supplierName = decodeURIComponent(parts[0]);
  const exp = parseInt(parts[1], 10);
  if (!supplierName || isNaN(exp)) return null;
  return { supplierName, exp };
}