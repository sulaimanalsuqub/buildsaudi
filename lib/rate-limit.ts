import { NextResponse } from "next/server";

// ── Rate Limiting ────────────────────────────────────────────────────────────
//
// الوضع الحالي: in-memory (كافٍ لـ single-instance أو staging)
// للإنتاج على Vercel مع auto-scaling: فعّل Upstash Redis بإضافة:
//   UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN في .env
// ثم قم بتثبيت: npm i @upstash/ratelimit @upstash/redis
// ─────────────────────────────────────────────────────────────────────────────

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const LIMITS = {
  api:   { requests: 100, windowMs: 60 * 1000 },
  forms: { requests: 20,  windowMs: 5 * 60 * 1000 },
  auth:  { requests: 10,  windowMs: 60 * 1000 },
  admin: { requests: 50,  windowMs: 60 * 1000 },
  email: { requests: 100, windowMs: 60 * 60 * 1000 },
};

type LimitType = keyof typeof LIMITS;

export function getRateLimitKey(identifier: string, type: LimitType = "api"): string {
  return `${type}:${identifier}`;
}

export function checkRateLimit(
  identifier: string,
  type: LimitType = "api"
): { ok: boolean; remaining: number; resetAt: number } {
  const key = getRateLimitKey(identifier, type);
  const limit = LIMITS[type];
  const now = Date.now();

  // تنظيف المدخلات المنتهية دورياً
  if (requestCounts.size > 500) {
    for (const [k, v] of requestCounts.entries()) {
      if (now >= v.resetAt) requestCounts.delete(k);
    }
  }

  let record = requestCounts.get(key);

  if (!record || now >= record.resetAt) {
    record = { count: 1, resetAt: now + limit.windowMs };
    requestCounts.set(key, record);
    return { ok: true, remaining: limit.requests - 1, resetAt: record.resetAt };
  }

  record.count++;

  if (record.count > limit.requests) {
    return { ok: false, remaining: 0, resetAt: record.resetAt };
  }

  return { ok: true, remaining: limit.requests - record.count, resetAt: record.resetAt };
}

export function rateLimitError(resetAt: number, type: string = "متكرر") {
  const resetDate = new Date(resetAt);
  return NextResponse.json(
    { error: `تم تجاوز حد طلبات ${type}. حاول مجدداً في ${resetDate.toLocaleTimeString("ar-SA")}` },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil((resetAt - Date.now()) / 1000).toString(),
        "X-RateLimit-Reset": resetAt.toString(),
      },
    }
  );
}

export function getClientIdentifier(req: Request): string {
  const userId = req.headers.get("x-user-id");
  if (userId) return userId;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  return ip.trim();
}
