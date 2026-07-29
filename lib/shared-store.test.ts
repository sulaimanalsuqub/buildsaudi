import assert from "node:assert/strict";
import test from "node:test";
import { claimSubmission, checkSharedRateLimit, getSubmissionState, resetSharedStoreForTests, saveSubmissionState } from "./shared-store.ts";

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;
env.NODE_ENV = "test";

test("concurrent identical submissions claim exactly one business operation", async () => {
  resetSharedStoreForTests();
  const initial = { status: "processing" as const, submissionId: "a", correlationId: "c" };
  const results = await Promise.all(Array.from({ length: 20 }, () => claimSubmission("submission:a", initial)));
  assert.equal(results.filter((r) => r.claimed).length, 1);
  assert.equal(results.filter((r) => !r.claimed && r.state.status === "processing").length, 19);
});

test("completed submission replays its persisted result", async () => {
  resetSharedStoreForTests();
  const initial = { status: "processing" as const, submissionId: "b", correlationId: "c" };
  await claimSubmission("submission:b", initial);
  await saveSubmissionState("submission:b", { ...initial, status: "completed", requestId: 42, trackingNumber: "BLD-1", trackingToken: "secure" });
  const replay = await claimSubmission("submission:b", { ...initial, correlationId: "new" });
  assert.equal(replay.claimed, false);
  assert.equal(replay.state.status, "completed");
  assert.equal(replay.state.requestId, 42);
  assert.equal(replay.state.trackingToken, "secure");
  assert.ok(replay.state.completedAt, "completed operations retain a durable tombstone");
  assert.equal((await getSubmissionState("submission:b"))?.requestId, 42);
});

test("a failed webhook retry can reclaim once, while a completed quote never creates a second quote", async () => {
  resetSharedStoreForTests();
  const webhook = { status: "failed" as const, operation: "webhook_event" as const, submissionId: "evt-1", correlationId: "evt-1", retryAfter: 0 };
  await saveSubmissionState("webhook-event:evt-1", webhook);
  assert.equal((await claimSubmission("webhook-event:evt-1", { ...webhook, status: "processing" })).claimed, true);
  const quote = { status: "processing" as const, operation: "quote" as const, submissionId: "quote-key", correlationId: "quote-1" };
  await claimSubmission("quote-intake:quote-key", quote);
  await saveSubmissionState("quote-intake:quote-key", { ...quote, status: "completed", requestId: 501, quoteType: "supplier" });
  const replay = await claimSubmission("quote-intake:quote-key", { ...quote, correlationId: "quote-2" });
  assert.equal(replay.claimed, false); assert.equal(replay.state.requestId, 501);
});

test("failed submission has a single atomic resume claimant", async () => {
  resetSharedStoreForTests();
  const failed = { status: "failed" as const, submissionId: "d", correlationId: "old", error: "timeout", retryAfter: 0 };
  await saveSubmissionState("submission:d", failed);
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => claimSubmission("submission:d", { status: "processing", submissionId: "d", correlationId: `retry-${i}` })));
  assert.equal(results.filter((r) => r.claimed).length, 1);
});

test("an active processing lease blocks a duplicate while an expired lease is reclaimable", async () => {
  resetSharedStoreForTests();
  const initial = { status: "processing" as const, submissionId: "lease", correlationId: "first" };
  const first = await claimSubmission("submission:lease", initial);
  assert.equal((await claimSubmission("submission:lease", { ...initial, correlationId: "second" })).claimed, false);
  await saveSubmissionState("submission:lease", { ...first.state, leaseExpiresAt: 0 });
  const recovered = await claimSubmission("submission:lease", { ...initial, correlationId: "recovered" });
  assert.equal(recovered.claimed, true);
  assert.equal(recovered.state.attempts, 2);
});

test("shared OTP rate limit survives parallel calls", async () => {
  resetSharedStoreForTests();
  const results = await Promise.all(Array.from({ length: 8 }, () => checkSharedRateLimit("otp:actor", 5, 60)));
  assert.equal(results.filter((r) => r.ok).length, 5);
  assert.equal(results.filter((r) => !r.ok).length, 3);
});

test("production refuses to process protected operations without shared Redis", async () => {
  const env = process.env as Record<string, string | undefined>;
  const oldNode = env.NODE_ENV; const oldUrl = env.UPSTASH_REDIS_REST_URL; const oldToken = env.UPSTASH_REDIS_REST_TOKEN;
  env.NODE_ENV = "production"; delete env.UPSTASH_REDIS_REST_URL; delete env.UPSTASH_REDIS_REST_TOKEN;
  try {
    await assert.rejects(() => claimSubmission("production-missing-store", { status: "processing", submissionId: "blocked", correlationId: "c" }), /Shared Redis is required/);
  } finally {
    if (oldNode === undefined) delete env.NODE_ENV; else env.NODE_ENV = oldNode;
    if (oldUrl === undefined) delete env.UPSTASH_REDIS_REST_URL; else env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN; else env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  }
});

test.after(() => { env.NODE_ENV = originalNodeEnv; });
