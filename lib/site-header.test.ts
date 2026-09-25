import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("header WhatsApp link opens the approved support number", () => {
  const header = readFileSync("components/layout/site-header.tsx", "utf8");

  assert.match(header, /https:\/\/wa\.me\/966553771777\?text=/);
});
