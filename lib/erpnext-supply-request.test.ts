import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createSupplyRequestInErpnext } from "./erpnext-supply-request.ts";
import { ErpnextClientError } from "./erpnext.ts";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

// ─────────────────────────────────────────────────────────────
// Fake Frappe REST backend (in-memory) driven via globalThis.fetch
// ─────────────────────────────────────────────────────────────

type Store = Record<string, Record<string, unknown>[]>;
let store: Store;
let calls: { method: string; path: string; body: unknown }[];
let counters: Record<string, number>;
// hooks to force error responses
let failNextStatus: number | null;
let failThrow: Error | null;

function reset() {
  store = { Contact: [], Customer: [], Address: [], Item: [], Project: [], "Material Request": [], Comment: [] };
  calls = [];
  counters = {};
  failNextStatus = null;
  failThrow = null;
}

function nextName(doctype: string, prefix: string): string {
  counters[doctype] = (counters[doctype] || 0) + 1;
  return `${prefix}-${String(counters[doctype]).padStart(4, "0")}`;
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

    // auth header must always be present
    assert.equal(new Headers(options?.headers).get("Authorization"), "token test-key:test-secret");

    if (failNextStatus) {
      const s = failNextStatus;
      failNextStatus = null;
      return json({ exc_type: s >= 500 ? "InternalServerError" : "ValidationError", _server_messages: JSON.stringify([JSON.stringify({ message: "boom" })]) }, s);
    }

    // method calls (add_tag, upload_file)
    if (path.startsWith("/api/method/")) {
      return json({ message: {} });
    }

    // resource list / get / create / update
    const m = path.match(/^\/api\/resource\/([^/]+)(?:\/(.+))?$/);
    assert.ok(m, `unexpected path ${path}`);
    const doctype = decodeURIComponent(m![1]);
    const name = m![2] ? decodeURIComponent(m![2]) : null;
    store[doctype] = store[doctype] || [];

    if (method === "GET" && !name) {
      // list with filters
      const filters = u.searchParams.get("filters");
      const parsed: [string, string, unknown][] = filters ? JSON.parse(filters) : [];
      let rows = store[doctype];
      for (const [field, op, value] of parsed) {
        assert.equal(op, "=");
        rows = rows.filter((r) => String(r[field] ?? "").toLowerCase() === String(value).toLowerCase());
      }
      return json({ data: rows });
    }
    if (method === "GET" && name) {
      const row = store[doctype].find((r) => r.name === name);
      if (!row) return json({ exc_type: "DoesNotExistError" }, 404);
      return json({ data: row });
    }
    if (method === "POST" && !name) {
      const prefixes: Record<string, string> = { Customer: "CUST", Contact: "CONT", Address: "ADDR", Item: "ITEM", Project: "PROJ", "Material Request": "MAT-MR-2026", Comment: "COMMENT" };
      const newName = (body.item_code as string) || (body.name as string) || nextName(doctype, prefixes[doctype] || doctype.toUpperCase());
      // unique item_code -> conflict
      if (doctype === "Item" && store.Item.some((r) => r.name === newName)) {
        return json({ exc_type: "DuplicateEntryError", _server_messages: JSON.stringify([JSON.stringify({ message: "already exists" })]) }, 409);
      }
      const row = { ...body, name: newName };
      store[doctype].push(row);
      return json({ data: row });
    }
    if (method === "PUT" && name) {
      const row = store[doctype].find((r) => r.name === name);
      Object.assign(row || {}, body);
      return json({ data: row });
    }
    throw new Error(`unhandled ${method} ${path}`);
  }) as typeof fetch;
}

const baseInput = {
  submissionId: "11111111-1111-1111-1111-111111111111",
  contactName: "محمد الأحمد",
  email: "customer@example.test",
  phone: "+966500000001",
  projectName: "فيلا الملقا",
  notes: "توريد للموقع",
  requestedDeliveryDate: "2026-11-01",
  correlationId: "corr-1",
  lines: [
    { itemName: "خلاط مغسلة", quantity: 10, unit: "قطعة", brand: "GROHE" },
    { itemName: "ماسورة PVC 4 إنش", quantity: 100, unit: "متر" },
  ],
};

beforeEach(() => {
  process.env.ERPNEXT_BASE_URL = "https://erp.example.test";
  process.env.ERPNEXT_API_KEY = "test-key";
  process.env.ERPNEXT_API_SECRET = "test-secret";
  process.env.ERPNEXT_COMPANY = "EFAD FOR MARKETING";
  reset();
  installFetch();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test("fresh request: creates Customer + Items + Material Request (Purpose=Purchase, Draft) and returns MR name as tracking", async () => {
  const result = await createSupplyRequestInErpnext({ ...baseInput });

  // customer created (Individual — no legalName)
  assert.equal(store.Customer.length, 1);
  assert.equal(store.Customer[0].customer_type, "Individual");

  // two items created, tagged Needs Review group
  assert.equal(store.Item.length, 2);
  assert.ok(store.Item.every((i) => i.item_group === "Needs Review"));
  // add_tag called for each new item
  assert.equal(calls.filter((c) => c.path === "/api/method/frappe.desk.doctype.tag.tag.add_tag").length, 2);

  // project created and linked to the customer (native customer↔purchase linkage)
  assert.equal(store.Project.length, 1);
  assert.equal(store.Project[0].customer, store.Customer[0].name);
  assert.equal(store.Project[0].company, "EFAD FOR MARKETING");

  // one Material Request
  assert.equal(store["Material Request"].length, 1);
  const mr = store["Material Request"][0] as Record<string, unknown>;
  assert.equal(mr.material_request_type, "Purchase");
  assert.equal(mr.company, "EFAD FOR MARKETING");
  // MR.customer is intentionally NOT set (cleared by depends_on for Purchase); linkage is via project on items
  assert.equal(mr.customer, undefined);
  assert.equal((mr.items as unknown[]).length, 2);
  const firstItem = (mr.items as Record<string, unknown>[])[0];
  assert.equal(firstItem.qty, 10);
  assert.equal(firstItem.schedule_date, "2026-11-01");
  assert.ok(firstItem.uom);
  assert.equal(firstItem.project, store.Project[0].name);
  // no submit (status not forced) — remains a plain insert
  assert.equal(mr.docstatus ?? 0, 0);

  // tracking number is the MR name
  assert.equal(result.trackingNumber, mr.name);
  assert.equal(result.project, store.Project[0].name);
  assert.equal(result.createdItems.length, 2);
});

test("item matching: existing Item by item_name is reused, not duplicated", async () => {
  store.Item.push({ name: "خلاط مغسلة", item_name: "خلاط مغسلة", stock_uom: "Nos", item_group: "Plumbing" });

  const result = await createSupplyRequestInErpnext({ ...baseInput });

  // only the SECOND line creates a new item; first is reused
  assert.equal(store.Item.length, 2); // 1 preexisting + 1 new (PVC pipe)
  assert.equal(result.reusedItems.length, 1);
  assert.equal(result.reusedItems[0], "خلاط مغسلة");
  assert.equal(result.createdItems.length, 1);
});

test("duplicate customer handling: existing Contact (by email) linked to a Customer reuses that Customer", async () => {
  store.Customer.push({ name: "CUST-EXIST", customer_name: "عميل موجود", customer_type: "Individual" });
  store.Contact.push({
    name: "CONT-EXIST",
    email_id: "customer@example.test",
    links: [{ link_doctype: "Customer", link_name: "CUST-EXIST" }],
  });

  const result = await createSupplyRequestInErpnext({ ...baseInput });

  // no new customer created
  assert.equal(store.Customer.length, 1);
  assert.equal(result.customer, "CUST-EXIST");
  // linkage flows through the project (MR has no customer field for Purchase type)
  assert.equal(store.Project[0].customer, "CUST-EXIST");
  assert.equal((store["Material Request"][0] as Record<string, unknown> & { items: Record<string, unknown>[] }).items[0].project, store.Project[0].name);
});

test("company request sets customer_type Company + Commercial group", async () => {
  await createSupplyRequestInErpnext({ ...baseInput, legalName: "شركة البناء المتقدم" });
  assert.equal(store.Customer[0].customer_type, "Company");
  assert.equal(store.Customer[0].customer_group, "Commercial");
  assert.equal(store.Customer[0].customer_name, "شركة البناء المتقدم");
});

test("ERPNext 5xx surfaces as retryable network ErpnextClientError", async () => {
  failNextStatus = 503;
  await assert.rejects(
    () => createSupplyRequestInErpnext({ ...baseInput }),
    (err: unknown) => {
      assert.ok(err instanceof ErpnextClientError);
      assert.equal(err.kind, "network");
      assert.equal(err.retryable, true);
      return true;
    }
  );
});

test("ERPNext 4xx surfaces as non-retryable validation ErpnextClientError", async () => {
  failNextStatus = 417;
  await assert.rejects(
    () => createSupplyRequestInErpnext({ ...baseInput }),
    (err: unknown) => {
      assert.ok(err instanceof ErpnextClientError);
      assert.equal(err.kind, "validation");
      assert.equal(err.retryable, false);
      return true;
    }
  );
});

test("ERPNext network timeout surfaces as timeout ErpnextClientError", async () => {
  failThrow = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
  await assert.rejects(
    () => createSupplyRequestInErpnext({ ...baseInput }),
    (err: unknown) => {
      assert.ok(err instanceof ErpnextClientError);
      assert.equal(err.kind, "timeout");
      return true;
    }
  );
});

test("empty lines rejected before any ERPNext write", async () => {
  await assert.rejects(
    () => createSupplyRequestInErpnext({ ...baseInput, lines: [] }),
    (err: unknown) => err instanceof ErpnextClientError && err.kind === "validation"
  );
  assert.equal(calls.length, 0);
});
