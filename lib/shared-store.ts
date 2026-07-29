/**
 * Upstash Redis is the authoritative atomic-claim layer for Odoo Online.
 * Odoo Studio stores the matching business key for audit/reconciliation; it is
 * deliberately not presented as a database uniqueness constraint.
 */
type RedisReply = unknown;
type LocalValue = { value: string; expiresAt: number };

function config() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("Shared Redis is required in production");
    return null;
  }
  return { url: url.replace(/\/$/, ""), token };
}

const local = new Map<string, LocalValue>();
export function resetSharedStoreForTests(): void { local.clear(); }

async function command(args: string[]): Promise<RedisReply> {
  const cfg = config();
  if (!cfg) {
    const [op, key, value, flag] = args;
    const existing = local.get(key);
    if (existing && existing.expiresAt <= Date.now()) local.delete(key);
    if (op === "GET") return local.get(key)?.value ?? null;
    if (op === "SET") {
      if (flag === "NX" && local.has(key)) return null;
      const ex = args.indexOf("EX");
      const ttl = ex >= 0 ? Number(args[ex + 1]) : Infinity;
      local.set(key, { value: value!, expiresAt: Number.isFinite(ttl) ? Date.now() + ttl * 1000 : Infinity });
      return "OK";
    }
    throw new Error(`Unsupported local Redis command ${op}`);
  }
  const response = await fetch(`${cfg.url}/pipeline`, {
    method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([args]), cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shared Redis HTTP ${response.status}`);
  const body = (await response.json()) as { result?: RedisReply; error?: string }[];
  if (body[0]?.error) throw new Error(`Shared Redis error: ${body[0].error}`);
  return body[0]?.result;
}

export type OperationKind = "customer_submission" | "quote" | "webhook_event" | "outbox" | "outbox_dispatch" | "winner_selection" | "customer_offer";
export type SubmissionState = {
  status: "processing" | "completed" | "failed";
  operation?: OperationKind;
  submissionId: string;
  requestId?: number;
  trackingNumber?: string;
  trackingToken?: string;
  quoteType?: "supplier" | "freight";
  stage?: string;
  correlationId: string;
  error?: string;
  attempts?: number;
  leaseExpiresAt?: number;
  retryAfter?: number;
  completedAt?: number;
  updatedAt?: number;
};

const PROCESSING_LEASE_SECONDS = 15 * 60;
const FAILED_RETENTION_SECONDS = 90 * 24 * 60 * 60;
const FAILED_RETRY_DELAY_MS = 60_000;

function processingState(initial: SubmissionState, previous?: SubmissionState): SubmissionState {
  const now = Date.now();
  return { ...initial, status: "processing", attempts: (previous?.attempts ?? 0) + 1, leaseExpiresAt: now + PROCESSING_LEASE_SECONDS * 1000, retryAfter: undefined, completedAt: undefined, updatedAt: now };
}

export async function getSubmissionState(key: string): Promise<SubmissionState | null> {
  const raw = await command(["GET", key]);
  if (typeof raw !== "string") return null;
  try { return JSON.parse(raw) as SubmissionState; } catch { throw new Error("Corrupt shared submission state"); }
}

/**
 * Atomically claims a business operation. Completed records are permanent tombstones
 * (no Redis TTL). Processing records are leases, so a crash can be reconciled/retried
 * after expiry without allowing two active workers.
 */
export async function claimSubmission(key: string, initial: SubmissionState): Promise<{ claimed: boolean; state: SubmissionState }> {
  const cfg = config();
  const now = Date.now();
  if (!cfg) {
    const raw = local.get(key);
    if (raw && raw.expiresAt <= now) local.delete(key);
    const currentRaw = local.get(key)?.value;
    const current = currentRaw ? JSON.parse(currentRaw) as SubmissionState : null;
    if (!current || (current.status === "processing" && (current.leaseExpiresAt ?? 0) <= now) || (current.status === "failed" && (current.retryAfter ?? 0) <= now)) {
      const next = processingState(initial, current ?? undefined);
      local.set(key, { value: JSON.stringify(next), expiresAt: Date.now() + PROCESSING_LEASE_SECONDS * 1000 });
      return { claimed: true, state: next };
    }
    return { claimed: false, state: current };
  }
  const proposed = processingState(initial);
  const script = [
    "local raw=redis.call('GET',KEYS[1])",
    "if not raw then redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[2]); return {1,ARGV[1]} end",
    "local old=cjson.decode(raw)",
    "if old.status=='completed' then return {0,raw} end",
    "local now=tonumber(ARGV[3])",
    "local retry=(old.status=='failed' and (not old.retryAfter or tonumber(old.retryAfter)<=now)) or (old.status=='processing' and (not old.leaseExpiresAt or tonumber(old.leaseExpiresAt)<=now))",
    "if not retry then return {0,raw} end",
    "local next=cjson.decode(ARGV[1]); next.attempts=(tonumber(old.attempts) or 0)+1; next.updatedAt=now; next.leaseExpiresAt=now+tonumber(ARGV[2])*1000",
    "local encoded=cjson.encode(next); redis.call('SET',KEYS[1],encoded,'EX',ARGV[2]); return {1,encoded}",
  ].join("; ");
  const response = await fetch(`${cfg.url}/pipeline`, {
    method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["EVAL", script, "1", key, JSON.stringify(proposed), String(PROCESSING_LEASE_SECONDS), String(now)]]), cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shared Redis HTTP ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: string }[];
  if (body[0]?.error) throw new Error(`Shared Redis error: ${body[0].error}`);
  const result = body[0]?.result as [number, string] | undefined;
  if (!Array.isArray(result) || typeof result[1] !== "string") throw new Error("Invalid shared submission claim response");
  return { claimed: result[0] === 1, state: JSON.parse(result[1]) as SubmissionState };
}

/** Saves terminal state. Completed tombstones intentionally have no expiry. */
export async function saveSubmissionState(key: string, state: SubmissionState): Promise<void> {
  const now = Date.now();
  const next: SubmissionState = state.status === "completed"
    ? { ...state, completedAt: state.completedAt ?? now, updatedAt: now, leaseExpiresAt: undefined, retryAfter: undefined }
    : state.status === "failed"
      ? { ...state, updatedAt: now, leaseExpiresAt: undefined, retryAfter: state.retryAfter ?? now + FAILED_RETRY_DELAY_MS }
      : { ...state, updatedAt: now, leaseExpiresAt: state.leaseExpiresAt ?? now + PROCESSING_LEASE_SECONDS * 1000 };
  const args = ["SET", key, JSON.stringify(next)] as string[];
  if (next.status === "processing") args.push("EX", String(PROCESSING_LEASE_SECONDS));
  if (next.status === "failed") args.push("EX", String(FAILED_RETENTION_SECONDS));
  const result = await command(args);
  if (result !== "OK") throw new Error("Unable to persist submission state");
}

/** Fixed-window shared limiter. Redis INCR is atomic across concurrent Vercel invocations. */
export async function checkSharedRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; resetAt: number }> {
  const cfg = config();
  if (!cfg) {
    const now = Date.now(); const current = local.get(key);
    const count = current && current.expiresAt > now ? Number(current.value) + 1 : 1;
    local.set(key, { value: String(count), expiresAt: now + windowSeconds * 1000 });
    return { ok: count <= limit, resetAt: now + windowSeconds * 1000 };
  }
  const script = "local c=redis.call('INCR',KEYS[1]); if c==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return c";
  const response = await fetch(`${cfg.url}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" }, body: JSON.stringify([["EVAL", script, "1", key, String(windowSeconds)]]), cache: "no-store" });
  if (!response.ok) throw new Error(`Shared Redis HTTP ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: string }[];
  if (body[0]?.error) throw new Error(`Shared Redis error: ${body[0].error}`);
  const count = Number(body[0]?.result);
  return { ok: Number.isFinite(count) && count <= limit, resetAt: Date.now() + windowSeconds * 1000 };
}
