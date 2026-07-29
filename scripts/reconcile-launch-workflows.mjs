/*
 * Read-only Odoo Online / Redis reconciliation report. It never writes Odoo,
 * sends email, invokes RFQs, or calls cron actions. Run against staging first.
 */
import fs from "node:fs";
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
if (process.env.RECONCILIATION_MODE !== "report" || process.env.ODOO_SCHEMA_TARGET !== "staging") throw new Error("Set RECONCILIATION_MODE=report and ODOO_SCHEMA_TARGET=staging");
const { ODOO_BASE_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
if (![ODOO_BASE_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN].every(Boolean)) throw new Error("Missing Odoo or Upstash staging configuration");
let rpcId = 0;
async function rpc(service, method, args) { const r = await fetch(`${ODOO_BASE_URL.replace(/\/$/, "")}/jsonrpc`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: ++rpcId }) }); const j = await r.json(); if (j.error) throw new Error(j.error.data?.message || j.error.message); return j.result; }
const uid = await rpc("common", "login", [ODOO_DATABASE, ODOO_USERNAME, ODOO_API_KEY]);
async function read(model, domain, fields) { return rpc("object", "execute_kw", [ODOO_DATABASE, uid, ODOO_API_KEY, model, "search_read", [domain], { fields, limit: 500 }]); }
async function redisGet(key) { const r = await fetch(`${UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` } }); if (!r.ok) throw new Error(`Upstash GET ${r.status}`); return (await r.json()).result; }
const sources = [
  ["customer_submission", "x_build_procurement_request", "x_studio_submission_key", (v) => `procurement-submission:${v}`],
  ["quote", "x_build_supplier_quote", "x_studio_idempotency_key", (v) => `quote-intake:${v}`],
  ["outbox", "x_build_integration_outbox", "x_studio_idempotency_key", (v) => `outbox:${v}`],
  ["approval", "x_build_ai_approval", "x_studio_idempotency_key", (v) => v],
];
const report = { checked: 0, missing_redis: [], mismatched_record: [], incomplete: [] };
for (const [kind, model, field, keyFor] of sources) {
  const rows = await read(model, [[field, "!=", false]], [field]);
  for (const row of rows) {
    report.checked += 1; const key = keyFor(row[field]); const raw = await redisGet(key);
    if (!raw) { report.missing_redis.push({ kind, model, id: row.id, key }); continue; }
    const state = JSON.parse(raw);
    if (state.status !== "completed") report.incomplete.push({ kind, model, id: row.id, key, status: state.status, stage: state.stage });
    if (state.requestId && state.requestId !== row.id) report.mismatched_record.push({ kind, model, id: row.id, key, redis_record_id: state.requestId });
  }
}
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.missing_redis.length || report.mismatched_record.length ? 2 : 0;
