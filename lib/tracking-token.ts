import { randomBytes } from "node:crypto";

/** Bearer secret لحماية عرض حالة الطلب؛ 256-bit عشوائي وغير مشتق من IDs أو sequences. */
export function generateSecureTrackingToken(): string {
  return randomBytes(32).toString("base64url");
}
