import { createHmac } from "crypto";

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

const STEP_SECONDS = 60;
const VALID_WINDOWS = 5; // 5 minutes validity

function computeCode(email: string, step: number): string {
  const hash = createHmac("sha256", getSecret())
    .update(`otp:${email.toLowerCase().trim()}:${step}`)
    .digest("hex");
  return ((parseInt(hash.slice(-8), 16) % 900000) + 100000).toString();
}

export function generateOTP(email: string): string {
  const step = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  return computeCode(email, step);
}

export function verifyOTP(email: string, code: string): boolean {
  const currentStep = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  for (let i = 0; i < VALID_WINDOWS; i++) {
    if (computeCode(email, currentStep - i) === code.trim()) return true;
  }
  return false;
}

// Signed token issued after successful OTP verification (stateless, no DB)
export function generateVerifiedToken(email: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", getSecret())
    .update(`verified:${email.toLowerCase().trim()}:${ts}`)
    .digest("hex")
    .slice(0, 16);
  return `${ts}.${sig}`;
}

// Returns true if token is valid and was issued within 30 minutes
export function verifyEmailToken(email: string, token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const ts = parseInt(parts[0], 10);
  if (isNaN(ts)) return false;
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age < 0 || age > 1800) return false;
  const expected = createHmac("sha256", getSecret())
    .update(`verified:${email.toLowerCase().trim()}:${ts}`)
    .digest("hex")
    .slice(0, 16);
  return expected === parts[1];
}
