/**
 * Durable, cross-invocation state using Upstash Redis REST.  Production must never
 * silently fall back to process memory: this store protects financial workflows,
 * retries and abuse controls across Vercel instances.
 */
type RedisReply = unknown;

function config() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("Shared Redis is required in production");
    return null;
  }
  return { url: url.replace(/\/$/, ""), token };
}

const local = new Map<string, { value: string; expiresAt: number }>();

async function command(args: string[]): Promise<RedisReply> {
  const cfg = config();
  if (!cfg) {
    const [op, key, value, flag, seconds] = args;
    const now = Date.now();
    const existing = local.get(key);
    if (existing && existing.expiresAt <= now) local.delete(key);
    if (op === "GET") return local.get(key)?.value ?? null;
    if (op === "SET") {
      if (flag === "NX" && local.has(key)) return null;
      const ttlArg = args.indexOf("EX");
      const ttl = ttlArg >= 0 ? Number(args[ttlArg + 1]) : Number(seconds);
      local.set(key, { value: value!, expiresAt: now + (Number.isFinite(ttl) ? ttl * 1000 : 86400000) });
      return "OK";
    }
    throw new Error(`Unsupported local Redis command ${op}`);
  }
  const response = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([args]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shared Redis HTTP ${response.status}`);
  const body = (await response.json()) as { result?: RedisReply; error?: string }[];
  if (body[0]?.error) throw new Error(`Shared Redis error: ${body[0].error}`);
  return body[0]?.result;
}

export type SubmissionState = {
  status: "processing" | "completed" | "failed";
  submissionId: string;
  requestId?: number;
  trackingNumber?: string;
  trackingToken?: string;
  stage?: string;
  correlationId: string;
  error?: string;
};

const SUBMISSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function getSubmissionState(key: string): Promise<SubmissionState | null> {
  const raw = await command(["GET", key]);
  if (typeof raw !== "string") return null;
  try { return JSON.parse(raw) as SubmissionState; } catch { throw new Error("Corrupt shared submission state"); }
}

/** Atomically reserve a new key. Existing keys are returned unchanged. */
export async function reserveSubmission(key: string, initial: SubmissionState): Promise<{ claimed: boolean; state: SubmissionState }> {
  const result = await command(["SET", key, JSON.stringify(initial), "NX", "EX", String(SUBMISSION_TTL_SECONDS)]);
  if (result === "OK") return { claimed: true, state: initial };
  const existing = await getSubmissionState(key);
  if (!existing) throw new Error("Shared submission reservation lost");
  return { claimed: false, state: existing };
}

export async function saveSubmissionState(key: string, state: SubmissionState): Promise<void> {
  const result = await command(["SET", key, JSON.stringify(state), "EX", String(SUBMISSION_TTL_SECONDS)]);
  if (result !== "OK") throw new Error("Unable to persist submission state");
}

/** Fixed-window shared limiter. Redis INCR is atomic across concurrent Vercel invocations. */
export async function checkSharedRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; resetAt: number }> {
  const cfg = config();
  if (!cfg) {
    const now = Date.now();
    const current = local.get(key);
    const count = current && current.expiresAt > now ? Number(current.value) + 1 : 1;
    local.set(key, { value: String(count), expiresAt: now + windowSeconds * 1000 });
    return { ok: count <= limit, resetAt: now + windowSeconds * 1000 };
  }
  // Lua gives INCR + first-write expiry atomically, avoiding a permanent key if a process dies.
  const script = "local c=redis.call('INCR',KEYS[1]); if c==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return c";
  const response = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["EVAL", script, "1", key, String(windowSeconds)]]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shared Redis HTTP ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: string }[];
  if (body[0]?.error) throw new Error(`Shared Redis error: ${body[0].error}`);
  const count = Number(body[0]?.result);
  return { ok: Number.isFinite(count) && count <= limit, resetAt: Date.now() + windowSeconds * 1000 };
}
