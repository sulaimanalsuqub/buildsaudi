import { NextResponse } from "next/server";

// Simple in-memory rate limiter with TTL
// For production, consider using Upstash Redis or similar
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const LIMITS = {
  // API endpoints - requests per minute
  api: { requests: 100, windowMs: 60 * 1000 },
  // Form submissions - requests per 5 minutes
  forms: { requests: 20, windowMs: 5 * 60 * 1000 },
  // Auth endpoints - requests per minute
  auth: { requests: 10, windowMs: 60 * 1000 },
  // Admin operations - requests per minute
  admin: { requests: 50, windowMs: 60 * 1000 },
  // Email sending - requests per hour
  email: { requests: 100, windowMs: 60 * 60 * 1000 },
};

type LimitType = keyof typeof LIMITS;

export function getRateLimitKey(identifier: string, type: LimitType = "api"): string {
  return `${type}:${identifier}`;
}

export function checkRateLimit(identifier: string, type: LimitType = "api"): { ok: boolean; remaining: number; resetAt: number } {
  const key = getRateLimitKey(identifier, type);
  const limit = LIMITS[type];
  const now = Date.now();

  let record = requestCounts.get(key);

  // Initialize or reset if expired
  if (!record || now >= record.resetAt) {
    record = { count: 1, resetAt: now + limit.windowMs };
    requestCounts.set(key, record);
    // Clean up old entries every 100 requests
    if (requestCounts.size % 100 === 0) {
      for (const [k, v] of requestCounts.entries()) {
        if (now >= v.resetAt) {
          requestCounts.delete(k);
        }
      }
    }
    return { ok: true, remaining: limit.requests - 1, resetAt: record.resetAt };
  }

  // Increment counter
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
  // Try to get user ID from headers (will be set by middleware)
  const userId = req.headers.get("x-user-id");
  if (userId) return userId;

  // Fallback to IP address
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  return ip.trim();
}
