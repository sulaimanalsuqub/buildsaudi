import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resetSharedStoreForTests } from "./shared-store.ts";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const partners: Record<string, unknown>[] = [];
let createCalls = 0;
let rejectCreate = false;
let loseCreateResponse = false;
let duplicateDomain: unknown[] = [];
const input = {
  establishment_name: "Test Supply", country: "السعودية", country_code: "SA",
  supplier_type: "local", business_type: "distributor", contact_name: "Test Contact",
  job_title: "Sales", email: "vendor@example.test", phone: "+966500000001",
  category_names: ["السباكة وأنظمة الأنابيب"], brands: ["Example"], short_description: "<script>alert(1)</script>",
  website: "https://example.test",
  other_category_suggestion: "Special fittings", preferred_language: "ar",
};

beforeEach(() => {
  process.env.ODOO_BASE_URL = "https://odoo.example.test";
  process.env.ODOO_DATABASE = "test";
  process.env.ODOO_API_KEY = "test-secret";
  delete process.env.VENDOR_ODOO_BASE_URL;
  delete process.env.VENDOR_ODOO_DATABASE;
  delete process.env.VENDOR_ODOO_API_KEY;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  resetSharedStoreForTests();
  partners.length = 0; createCalls = 0; rejectCreate = false; loseCreateResponse = false; duplicateDomain = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-secret");
    assert.equal(new Headers(options?.headers).get("X-Odoo-Database"), "test");
    const path = new URL(String(url)).pathname;
    const body = JSON.parse(String(options?.body));
    let result: unknown;
    if (path === "/json/2/res.country/search_read") {
      const code = body.domain?.[0]?.[2];
      assert.ok(code === "SA" || code === "AE"); result = [{ id: code === "AE" ? 230 : 192 }];
    } else if (path === "/json/2/res.partner.category/search_read") {
      result = [{ id: 1, name: "Supplier" }, { id: 14, name: "pending_review" }, { id: 21, name: "السباكة وأنظمة الأنابيب" }];
    } else if (path === "/json/2/res.partner/search_read") {
      if (body.domain[0][0] === "ref") {
        result = partners.filter((p) => p.ref === body.domain[0][2]).map((p) => ({ id: p.id }));
      } else {
        duplicateDomain = body.domain;
        result = partners.filter((p) => p.name === input.establishment_name && p.email === input.email).map((p) => ({ id: p.id }));
      }
    } else if (path === "/json/2/res.partner/create") {
      createCalls++;
      if (rejectCreate) return Response.json({ message: "secret diagnostic" }, { status: 403 });
      assert.equal(body.vals_list.length, 1);
      partners.push({ ...body.vals_list[0], id: 101 });
      if (loseCreateResponse) throw new Error("connection reset after commit");
      result = [101];
    } else throw new Error(`Unexpected Odoo request: ${path}`);
    return Response.json(result);
  };
});
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...originalEnv }; });

async function registration() {
  return import("./vendor-registration.ts");
}

test("saves the supplier and contact atomically in native Odoo fields with all form details", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  const result = await mod.registerVendor(input);
  assert.equal(result.status, "registered");
  const p = partners[0];
  assert.equal(p.name, "Test Supply"); assert.equal(p.supplier_rank, 1);
  assert.equal(p.country_id, 192); assert.equal(p.email, "vendor@example.test");
  assert.deepEqual(p.category_id, [[6, 0, [1, 14, 21]]]);
  assert.deepEqual(p.child_ids, [[0, 0, { name: "Test Contact", function: "Sales", email: "vendor@example.test", phone: "+966500000001", type: "contact" }]]);
  for (const detail of ["Example", "Special fittings", "pending_review", "distributor"]) assert.ok(String(p.comment).includes(detail));
  assert.doesNotMatch(String(p.comment), /السباكة وأنظمة الأنابيب/);
  assert.ok(!String(p.comment).includes("<script>"));
  assert.ok(String(p.comment).includes("&lt;script&gt;"));
  assert.match(String(p.ref), /^build:vendor:/);
});

test("saves international supplier commercial terms in native Odoo fields", async () => {
  const mod = await registration();
  await mod.registerVendor({
    ...input,
    country: "الإمارات", country_code: "AE", supplier_type: "international",
    supplier_currency_id: 1, supplier_payment_term_id: 4, supplier_payment_method_line_id: 6,
    purchase_incoterm_id: 4, purchase_incoterm_location: "ميناء جبل علي",
  });
  const p = partners[0];
  assert.equal(p.property_purchase_currency_id, 1);
  assert.equal(p.property_supplier_payment_term_id, 4);
  assert.equal(p.property_outbound_payment_method_line_id, 6);
  assert.equal(p.purchase_incoterm_id, 4);
  assert.equal(p.purchase_incoterm_location, "ميناء جبل علي");
});

test("repeated and concurrent submissions do not create extra suppliers", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  const results = await Promise.allSettled([mod.registerVendor(input), mod.registerVendor(input)]);
  assert.ok(results.some((r) => r.status === "fulfilled" && r.value.status === "registered"));
  const replay = await mod.registerVendor(input);
  assert.equal(replay.status, "already_registered"); assert.equal(createCalls, 1);
});

test("detects existing Odoo suppliers even without a local submission cache", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  partners.push({ id: 80, name: input.establishment_name, email: input.email });
  assert.equal((await mod.registerVendor(input)).status, "already_registered");
  assert.deepEqual(duplicateDomain, [["is_company", "=", true], ["supplier_rank", ">", 0], ["country_id", "=", 192], ["name", "=ilike", "Test Supply"], "|", ["email", "=ilike", "vendor@example.test"], ["phone", "=", "+966500000001"]]);
  assert.equal(createCalls, 0);
});

test("rejects categories absent from Odoo before creating any supplier", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  await assert.rejects(mod.registerVendor({ ...input, category_names: ["Nonexistent"] }), /categor/i);
  assert.equal(createCalls, 0);
});

test("allows an immediately corrected submission after category validation fails", async () => {
  const mod = await registration();
  await assert.rejects(mod.registerVendor({ ...input, category_names: ["Nonexistent"] }));
  assert.equal((await mod.registerVendor(input)).status, "registered");
});

test("escapes literal LIKE characters in duplicate company and email searches", async () => {
  const mod = await registration();
  await mod.registerVendor({ ...input, establishment_name: "100%_Supply", email: "vendor_name@example.test" });
  assert.deepEqual(duplicateDomain[3], ["name", "=ilike", "100\\%\\_Supply"]);
  assert.deepEqual(duplicateDomain[5], ["email", "=ilike", "vendor\\_name@example.test"]);
});

test("Odoo failures never report success or retry an unsafe create", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  rejectCreate = true;
  await assert.rejects(mod.registerVendor(input), (error: Error) => !error.message.includes("secret diagnostic"));
  assert.equal(createCalls, 1); assert.equal(partners.length, 0);
});

test("reconciles a lost create response with the saved Odoo reference", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  loseCreateResponse = true;
  assert.equal((await mod.registerVendor(input)).status, "registered");
  assert.equal(createCalls, 1);
});

test("serves bilingual categories directly from Odoo with stable Arabic submission values", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  assert.deepEqual(await mod.listVendorCategories(), [{ id: "السباكة وأنظمة الأنابيب", nameAr: "السباكة وأنظمة الأنابيب", nameEn: "Plumbing & Piping Systems" }]);
});

test("rejects missing Odoo configuration without making a network request", async () => {
  const mod = await registration(); assert.ok(mod, "direct Odoo registration is missing");
  delete process.env.ODOO_API_KEY;
  globalThis.fetch = async () => { assert.fail("must not call Odoo without credentials"); };
  await assert.rejects(mod.listVendorCategories(), /configured/i);
});
