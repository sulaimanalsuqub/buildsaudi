import assert from "node:assert/strict";
import test from "node:test";
import { generateSecureTrackingToken } from "./tracking-token.ts";

test("tracking tokens are URL-safe, high-entropy and not repeated", () => {
  const tokens = new Set(Array.from({ length: 1_000 }, generateSecureTrackingToken));
  assert.equal(tokens.size, 1_000);
  for (const token of tokens) {
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  }
});
