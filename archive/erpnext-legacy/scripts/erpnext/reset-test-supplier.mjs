/**
 * Delete a supplier by name for clean re-registration tests.
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/reset-test-supplier.mjs "مؤسسة ايفاد العقارية"
 */

const BASE = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const TOKEN = process.env.ERPNEXT_API_TOKEN;
const name = process.argv[2] || "مؤسسة ايفاد العقارية";

if (!TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const H = { Authorization: `token ${TOKEN}`, Accept: "application/json" };

async function api(method, path) {
  const r = await fetch(`${BASE}${path}`, { method, headers: H });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

try {
  await api("DELETE", `/api/resource/Supplier/${encodeURIComponent(name)}`);
  console.log(`✅ Deleted supplier: ${name}`);
} catch (e) {
  if (e.message.includes("404") || e.message.includes("DoesNotExist")) {
    console.log(`↻ Supplier not found (already deleted): ${name}`);
  } else {
    throw e;
  }
}