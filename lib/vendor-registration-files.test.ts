import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createVendorFilesToken, readVendorFilesToken, uploadVendorRegistrationFile, validateVendorFileContent } from "./vendor-registration-files.ts";
import { MAX_VENDOR_FILE_BYTES, validateVendorFileMetadata } from "./vendor-file-policy.ts";
const fetchBefore = globalThis.fetch;
const envBefore = { ...process.env };
afterEach(() => { globalThis.fetch = fetchBefore; process.env = { ...envBefore }; });
const bytes = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
const metadata = { name: "كتالوج المورد.pdf", size: bytes.length, type: "application/pdf", sha256: createHash("sha256").update(bytes).digest("hex") };
test("validates size, names, MIME and actual executable content", async () => {
  assert.equal(validateVendorFileMetadata(metadata), null);
  for (const update of [{ name: "../test.pdf" }, { name: "test.exe.pdf" }, { size: 0 }, { size: MAX_VENDOR_FILE_BYTES + 1 }, { type: "text/html" }]) assert.ok(validateVendorFileMetadata({ ...metadata, ...update }));
  await validateVendorFileContent(metadata, bytes);
  const executable = Buffer.from("MZ executable pretending to be PDF");
  await assert.rejects(validateVendorFileContent({ ...metadata, size: executable.length, sha256: createHash("sha256").update(executable).digest("hex") }, executable));
  const activePdf = Buffer.from("%PDF-1.4 /JavaScript (evil)");
  await assert.rejects(validateVendorFileContent({ ...metadata, size: activePdf.length, sha256: createHash("sha256").update(activePdf).digest("hex") }, activePdf));
});
test("signed authorization binds the vendor and exact files without exposing credentials", () => {
  process.env.UPLOAD_TOKEN_SECRET = "test-upload-secret";
  const token = createVendorFilesToken(143, [metadata]);
  assert.equal(readVendorFilesToken(token).vendorId, 143);
  assert.throws(() => readVendorFilesToken(token + "tampered"));
  assert.ok(!token.includes("test-upload-secret"));
  const now = Date.now;
  try { Date.now = () => now() + 3_600_001; assert.throws(() => readVendorFilesToken(token)); } finally { Date.now = now; }
});
test("creates one linked Documents record; a lost response and replay reuse the same document", async () => {
  process.env.UPLOAD_TOKEN_SECRET = "test-upload-secret";
  process.env.VENDOR_ODOO_BASE_URL = "https://odoo.example.test";
  process.env.VENDOR_ODOO_DATABASE = "test"; process.env.VENDOR_ODOO_API_KEY = "secret";
  let created = false; let creates = 0;
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith("search_read")) return Response.json(created ? [{ id: 30 }] : []);
    assert.equal(path, "/json/2/documents.document/create");
    const vals = JSON.parse(String(init?.body)).vals_list[0];
    assert.equal(vals.partner_id, 143); assert.equal(vals.res_model, "res.partner"); assert.equal(vals.res_id, 143);
    assert.equal(vals.name, metadata.name); assert.equal(vals.raw, bytes.toString("base64"));
    assert.equal(vals.access_via_link, "none"); assert.match(vals.description, /Build Supplier Registration/);
    created = true; creates++;
    throw new Error("response lost after commit");
  };
  const token = createVendorFilesToken(143, [metadata]);
  const file = new File([bytes], metadata.name, { type: metadata.type });
  assert.equal(await uploadVendorRegistrationFile(token, file), 30);
  assert.equal(await uploadVendorRegistrationFile(token, file), 30);
  assert.equal(creates, 1);
  await assert.rejects(uploadVendorRegistrationFile(token, new File([bytes], "unauthorized.pdf", { type: metadata.type })));
});
