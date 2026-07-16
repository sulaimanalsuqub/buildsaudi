import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.UPLOAD_TOKEN_SECRET;
  if (!secret) throw new Error("UPLOAD_TOKEN_SECRET is not configured");
  return secret;
}

const MAX_AGE_SECONDS = 3600; // 1 hour

export function createUploadAttachToken(fileName: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", getSecret())
    .update(`attach:${fileName}:${ts}`)
    .digest("hex")
    .slice(0, 24);
  return `${ts}.${sig}`;
}

export function verifyUploadAttachToken(fileName: string, token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const ts = parseInt(parts[0], 10);
  if (isNaN(ts)) return false;
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age < 0 || age > MAX_AGE_SECONDS) return false;
  const expected = createHmac("sha256", getSecret())
    .update(`attach:${fileName}:${ts}`)
    .digest("hex")
    .slice(0, 24);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(parts[1]));
  } catch {
    return false;
  }
}