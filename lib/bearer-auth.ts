import { timingSafeEqual } from "crypto";

/** يقارن ترويسة Authorization: Bearer <secret> بأمان (زمن ثابت) مع سر داخلي (CRON_SECRET وما شابه) */
export function verifyBearerSecret(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
