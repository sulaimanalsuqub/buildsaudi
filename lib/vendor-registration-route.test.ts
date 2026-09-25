import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { resetSharedStoreForTests } from "./shared-store.ts";

// Resolve the app's existing TS aliases for Node's native test runner.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier === "next/server") return nextResolve("next/server.js", context);
  return nextResolve(specifier, context);
} });
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
let writes = 0;
let captchaValid = true;
let odooFails = false;
const payload = {
  establishment_name: "Route Test Supplier", country: "السعودية", supplier_type: "local",
  business_type: "distributor", contact_name: "Route Contact", email: "route@example.test",
  phone: "+966500000002", category_names: ["السباكة وأنظمة الأنابيب"], brands: ["Example"],
  preferred_language: "ar", privacy_accepted: true, terms_accepted: true, turnstile_token: "test-token",
};
beforeEach(() => {
  resetSharedStoreForTests(); writes = 0; captchaValid = true; odooFails = false;
  process.env.VENDOR_ODOO_BASE_URL = "https://odoo.example.test";
  process.env.VENDOR_ODOO_DATABASE = "test"; process.env.VENDOR_ODOO_API_KEY = "test-secret";
  process.env.TURNSTILE_SECRET_KEY = "test-captcha-secret";
  delete process.env.BUILD_OPT_BASE_URL; delete process.env.PUBLIC_INTAKE_SERVICE_SECRET;
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  globalThis.fetch = async (url, init) => {
    const target = new URL(String(url));
    if (target.hostname === "challenges.cloudflare.com") return Response.json({ success: captchaValid });
    assert.equal(target.hostname, "odoo.example.test", "no Build-OPT dependency or unexpected destination");
    if (odooFails) return Response.json({ message: "private diagnostic" }, { status: 401 });
    const body = JSON.parse(String(init?.body));
    switch (target.pathname) {
      case "/json/2/res.partner/search_read": return Response.json([]);
      case "/json/2/res.country/search_read":
        assert.deepEqual(body.domain, [["code", "=", "SA"]]); return Response.json([{ id: 192 }]);
      case "/json/2/res.partner.category/search_read": return Response.json([{ id: 1, name: "Supplier" }, { id: 14, name: "pending_review" }, { id: 21, name: "السباكة وأنظمة الأنابيب" }]);
      case "/json/2/res.partner/create":
        writes++; assert.equal(body.vals_list[0].name, "Route Test Supplier"); return Response.json([101]);
      default: throw new Error(`Unexpected request ${target.pathname}`);
    }
  };
});
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...originalEnv }; });

async function submit(body: unknown) {
  const { POST } = await import("../app/api/vendors/register/route.ts");
  const { NextRequest } = await import("next/server.js");
  return POST(new NextRequest("https://build.example.test/api/vendors/register", { method: "POST", body: JSON.stringify(body) }));
}
test("public route saves directly to Odoo without any Build-OPT configuration", async () => {
  const response = await submit(payload);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, status: "registered" });
  assert.equal(writes, 1);
});
test("public route rejects failed CAPTCHA before contacting Odoo", async () => {
  captchaValid = false;
  assert.equal((await submit(payload)).status, 400); assert.equal(writes, 0);
});
test("registration issues file authorization for the actual created vendor", async () => {
  const { readVendorFilesToken } = await import("./vendor-registration-files.ts");
  const files = [{ name: "catalog.pdf", type: "application/pdf", size: 100, sha256: "a".repeat(64) }];
  const response = await submit({ ...payload, files });
  assert.equal(response.status, 200);
  const body = await response.json();
  const authorization = readVendorFilesToken(body.uploadToken);
  assert.equal(authorization.vendorId, 101);
  assert.deepEqual(authorization.files, files);
});
test("rejects oversize and excessive files before creating the vendor", async () => {
  const file = { name: "catalog.pdf", type: "application/pdf", size: 100, sha256: "a".repeat(64) };
  assert.equal((await submit({ ...payload, files: Array(6).fill(file) })).status, 400);
  assert.equal((await submit({ ...payload, files: [{ ...file, size: 4 * 1024 * 1024 }] })).status, 400);
  assert.equal(writes, 0);
});
test("public route refuses missing consent without creating a supplier", async () => {
  assert.equal((await submit({ ...payload, privacy_accepted: false })).status, 400); assert.equal(writes, 0);
});
test("public route reports Odoo unavailability without claiming success or exposing diagnostics", async () => {
  odooFails = true;
  const response = await submit(payload);
  assert.equal(response.status, 503);
  const body = await response.json(); assert.equal(body.ok, undefined);
  assert.ok(!JSON.stringify(body).includes("private diagnostic")); assert.equal(writes, 0);
});
test("public categories endpoint works without the retired Build-OPT server", async () => {
  const { GET } = await import("../app/api/reference/material-categories/route.ts");
  const response = await GET(); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, categories: [{ id: "السباكة وأنظمة الأنابيب", nameAr: "السباكة وأنظمة الأنابيب", nameEn: "Plumbing & Piping Systems" }] });
});
