import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resetSharedStoreForTests } from "./shared-store.ts";
import { registerVendorInErpnext, ErpnextVendorError } from "./erpnext-vendor-registration.ts";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

type Store = Record<string, Record<string, unknown>[]>;
let store: Store;
let calls: { method: string; path: string; body: unknown }[];
let counters: Record<string, number>;
let failThrow: Error | null;

function reset() {
  store = { Contact: [], Supplier: [], Country: [{ name: "Saudi Arabia", code: "sa" }], Brand: [], "Party Specific Item": [] };
  calls = [];
  counters = {};
  failThrow = null;
}
function nextName(dt: string, prefix: string): string {
  counters[dt] = (counters[dt] || 0) + 1;
  return `${prefix}-${String(counters[dt]).padStart(4, "0")}`;
}
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function installFetch() {
  globalThis.fetch = (async (url: string | URL, options?: RequestInit) => {
    if (failThrow) throw failThrow;
    const u = new URL(String(url));
    const path = u.pathname;
    const method = options?.method || "GET";
    const body = options?.body ? JSON.parse(String(options.body)) : undefined;
    calls.push({ method, path, body });
    assert.equal(new Headers(options?.headers).get("Authorization"), "token test-key:test-secret");

    if (path.startsWith("/api/method/")) return json({ message: {} });

    const m = path.match(/^\/api\/resource\/([^/]+)(?:\/(.+))?$/);
    assert.ok(m, `unexpected ${path}`);
    const dt = decodeURIComponent(m![1]);
    const name = m![2] ? decodeURIComponent(m![2]) : null;
    store[dt] = store[dt] || [];

    if (method === "GET" && !name) {
      const filters = u.searchParams.get("filters");
      const parsed: [string, string, unknown][] = filters ? JSON.parse(filters) : [];
      let rows = store[dt];
      for (const [f, , v] of parsed) rows = rows.filter((r) => String(r[f] ?? "").toLowerCase() === String(v).toLowerCase());
      return json({ data: rows });
    }
    if (method === "GET" && name) {
      const row = store[dt].find((r) => r.name === name);
      return row ? json({ data: row }) : json({ exc_type: "DoesNotExistError" }, 404);
    }
    if (method === "POST" && !name) {
      const prefixes: Record<string, string> = { Supplier: "SUP-2026", Contact: "CONT", Brand: "BRAND", "Party Specific Item": "PSI" };
      const newName = (body.brand as string) || (body.name as string) || nextName(dt, prefixes[dt] || dt.toUpperCase());
      const row = { ...body, name: newName };
      store[dt].push(row);
      return json({ data: row });
    }
    if (method === "PUT" && name) {
      const row = store[dt].find((r) => r.name === name);
      Object.assign(row || {}, body);
      return json({ data: row });
    }
    throw new Error(`unhandled ${method} ${path}`);
  }) as typeof fetch;
}

const baseInput = {
  establishment_name: "مؤسسة التوريد المتقدم",
  country: "السعودية",
  country_code: "SA",
  supplier_type: "local",
  business_type: "distributor",
  contact_name: "خالد العتيبي",
  job_title: "مدير المبيعات",
  email: "supplier@example.test",
  phone: "+966500000011",
  category_names: ["السباكة وأنظمة الأنابيب", "الأدوات الصحية"],
  brands: ["GROHE", "Geberit"],
  short_description: "موزّع معتمد",
  preferred_language: "ar",
};

beforeEach(() => {
  process.env.ERPNEXT_BASE_URL = "https://erp.example.test";
  process.env.ERPNEXT_API_KEY = "test-key";
  process.env.ERPNEXT_API_SECRET = "test-secret";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  resetSharedStoreForTests();
  reset();
  installFetch();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test("creates Supplier (Company, pre-onboarding, RFQ-blocked) + Contact + capabilities", async () => {
  const result = await registerVendorInErpnext({ ...baseInput });
  assert.equal(result.status, "registered");
  assert.equal(store.Supplier.length, 1);
  const s = store.Supplier[0];
  assert.equal(s.supplier_type, "Company");
  assert.equal(s.supplier_group, "Distributor");
  assert.equal(s.country, "Saudi Arabia");
  assert.equal(s.default_currency, "SAR");
  assert.equal(s.disabled, 1);
  assert.equal(s.prevent_rfqs, 1);

  // lifecycle tag applied
  assert.ok(calls.some((c) => c.path === "/api/method/frappe.desk.doctype.tag.tag.add_tag" && (c.body as { tag: string }).tag === "build:pre-onboarding"));

  // contact linked + set primary
  assert.equal(store.Contact.length, 1);
  assert.deepEqual((store.Contact[0].links as { link_name: string }[])[0].link_name, s.name);
  assert.equal(s.supplier_primary_contact, store.Contact[0].name);

  // capabilities: 2 item groups + 2 brands
  const psi = store["Party Specific Item"];
  const groups = psi.filter((p) => p.restrict_based_on === "Item Group").map((p) => p.based_on_value);
  const brands = psi.filter((p) => p.restrict_based_on === "Brand").map((p) => p.based_on_value);
  assert.deepEqual(groups.sort(), ["Plumbing", "Sanitaryware"]);
  assert.deepEqual(brands.sort(), ["GROHE", "Geberit"]);
  assert.equal(store.Brand.length, 2);
});

test("idempotent: second identical submission returns already_registered (no second Supplier)", async () => {
  const first = await registerVendorInErpnext({ ...baseInput });
  const second = await registerVendorInErpnext({ ...baseInput });
  assert.equal(second.status, "already_registered");
  assert.equal(second.supplier, first.supplier);
  assert.equal(store.Supplier.length, 1);
});

test("dedup: existing Contact (by email) linked to a Supplier reuses it", async () => {
  store.Supplier.push({ name: "SUP-EXIST", supplier_name: "مورد موجود" });
  store.Contact.push({ name: "CONT-EXIST", email_id: "supplier@example.test", links: [{ link_doctype: "Supplier", link_name: "SUP-EXIST" }] });
  const result = await registerVendorInErpnext({ ...baseInput });
  assert.equal(result.status, "already_registered");
  assert.equal(result.supplier, "SUP-EXIST");
  assert.equal(store.Supplier.length, 1);
});

test("invalid category rejected (400) before creating a Supplier", async () => {
  await assert.rejects(
    () => registerVendorInErpnext({ ...baseInput, category_names: ["فئة غير معروفة"] }),
    (e: unknown) => e instanceof ErpnextVendorError && e.status === 400
  );
  assert.equal(store.Supplier.length, 0);
});

test("international supplier: no SAR default, supplier_group Local", async () => {
  store.Country.push({ name: "United Arab Emirates", code: "ae" });
  await registerVendorInErpnext({ ...baseInput, supplier_type: "international", business_type: "manufacturer", country: "الإمارات", country_code: "AE" });
  const s = store.Supplier[0];
  assert.equal(s.country, "United Arab Emirates");
  assert.equal(s.default_currency, undefined);
  assert.equal(s.supplier_group, "Local");
});
