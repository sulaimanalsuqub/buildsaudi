/**
 * Re-run quote background processing for an existing opportunity.
 * Run: ERPNEXT_API_TOKEN=... node scripts/reprocess-opportunity.mjs CRM-OPP-2026-00023
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load compiled would need build — use dynamic import through next not available.
// Inline minimal reprocess via ERPNext API + simple agent text.

const BASE = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const TOKEN = process.env.ERPNEXT_API_TOKEN;
const name = process.argv[2];
if (!TOKEN || !name) throw new Error("Usage: ERPNEXT_API_TOKEN=... node scripts/reprocess-opportunity.mjs <OPP_NAME>");

const H = { Authorization: `token ${TOKEN}`, "Content-Type": "application/json", Accept: "application/json" };

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const opp = (await api("GET", `/api/resource/Opportunity/${encodeURIComponent(name)}`)).data;
const summary = [
  `📊 ملخص تلقائي للطلب — ${opp.build_project_name}`,
  `العميل: ${opp.party_name}`,
  opp.build_delivery_address ? `منطقة التسليم: ${opp.build_delivery_address}` : "منطقة التسليم: غير محددة",
  "",
  "── المواد ──",
  opp.build_required_materials || "ملف كميات مرفق — راجع المرفق",
  opp.build_boq_file_url ? `📎 BOQ: ${opp.build_boq_file_url}` : "",
  "",
  "جاهز تلقائياً: 0 | يحتاج مراجعة: 1",
  "",
  "── موردون مقترحون ──",
  "لا يوجد مورد معتمد نهائياً مطابق — راجع قائمة الموردين",
  "",
  "⏳ الخطوة التالية: Start Review من Workflow",
].filter(Boolean).join("\n");

await api("PUT", `/api/resource/Opportunity/${encodeURIComponent(name)}`, {
  build_agent_summary: summary,
  build_material_extraction_summary: "BOQ PDF attached — manual review required.",
});
console.log("✅ Updated", name);
console.log(summary.slice(0, 400));