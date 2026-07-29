import assert from "node:assert/strict";
import test from "node:test";
import { retryableInboundOutcome, terminalInboundOutcome } from "./inbound-webhook-policy.ts";

test("processing/provider failures are persisted before returning retryable 5xx", async () => {
  let persisted = "";
  const result = await retryableInboundOutcome(new Error("Odoo timeout"), async (error) => { persisted = (error as Error).message; });
  assert.equal(result.status, 500); assert.equal(persisted, "Odoo timeout");
});

test("terminal invalid and attachment-review outcomes persist before returning 200", async () => {
  const stages: string[] = [];
  const invalid = await terminalInboundOutcome("unmatched_email", async () => { stages.push("unmatched_email"); });
  const attachment = await terminalInboundOutcome("attachment_review_required", async () => { stages.push("attachment_review_required"); });
  assert.equal(invalid.status, 200); assert.equal(attachment.status, 200);
  assert.deepEqual(stages, ["unmatched_email", "attachment_review_required"]);
});
