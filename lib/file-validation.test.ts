import assert from "node:assert/strict";
import test from "node:test";
import { validateSafeUpload } from "./file-validation.ts";

const b64 = (text: string) => Buffer.from(text).toString("base64");
test("accepts only content-validated PDF and CSV uploads", () => {
  assert.deepEqual(validateSafeUpload({ name: "quote.pdf", mimeType: "application/pdf", base64Data: b64("%PDF-1.7\nbody") }), { ok: true, kind: "pdf" });
  assert.deepEqual(validateSafeUpload({ name: "items.csv", mimeType: "text/csv", base64Data: b64("item,qty\ncement,2") }), { ok: true, kind: "csv" });
});
test("rejects spoofed MIME, traversal names and XLSX", () => {
  assert.equal(validateSafeUpload({ name: "quote.pdf", mimeType: "application/pdf", base64Data: b64("not a pdf") }).ok, false);
  assert.equal(validateSafeUpload({ name: "../quote.pdf", mimeType: "application/pdf", base64Data: b64("%PDF-1.7") }).ok, false);
  assert.equal(validateSafeUpload({ name: "quote.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64Data: b64("PK\x03\x04") }).ok, false);
});
