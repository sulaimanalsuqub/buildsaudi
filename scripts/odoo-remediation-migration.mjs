/*
 * Deliberately not run automatically.  Applies the Odoo Studio schema required by
 * the final-launch remediation branch. Odoo Online compatible: it creates only
 * Studio/manual metadata fields and never attempts SQL constraints or modules.
 * It must run only against an Odoo Online duplicated testing database.
 */
import fs from "node:fs";
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
if (process.env.CONFIRM_ODOO_SCHEMA_MIGRATION !== "yes" || process.env.ODOO_SCHEMA_TARGET !== "staging") {
  throw new Error("Safety stop: set CONFIRM_ODOO_SCHEMA_MIGRATION=yes and ODOO_SCHEMA_TARGET=staging; never run against Production first");
}
let id = 0; let uid;
async function rpc(service, method, args) {
  const response = await fetch(`${process.env.ODOO_BASE_URL.replace(/\/$/, "")}/jsonrpc`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: ++id }) });
  const json = await response.json(); if (json.error) throw new Error(json.error.data?.message || json.error.message); return json.result;
}
async function kw(model, method, args, kwargs = {}) { return rpc("object", "execute_kw", [process.env.ODOO_DATABASE, uid, process.env.ODOO_API_KEY, model, method, args, kwargs]); }
uid = await rpc("common", "login", [process.env.ODOO_DATABASE, process.env.ODOO_USERNAME, process.env.ODOO_API_KEY]);
const requiredModels = ["x_build_procurement_request", "x_build_supplier_quote", "x_build_ai_communication", "x_build_integration_outbox", "x_build_ai_approval"];
const models = await kw("ir.model", "search_read", [[ ["model", "in", requiredModels] ]], { fields: ["id", "model"], limit: requiredModels.length });
const modelByName = new Map(models.map((row) => [row.model, row.id]));
const missing = requiredModels.filter((model) => !modelByName.get(model));
if (missing.length) throw new Error(`Required Build models missing: ${missing.join(", ")}`);
const fields = [
  { name: "x_studio_submission_key", field_description: "Website Submission Key", ttype: "char", index: true, copy: false },
  { name: "x_studio_materials_net_cost", field_description: "Materials Net Cost SAR", ttype: "monetary" },
  { name: "x_studio_supplier_input_vat", field_description: "Supplier Input VAT SAR", ttype: "monetary" },
  { name: "x_studio_customer_taxable_base", field_description: "Customer Taxable Base SAR", ttype: "monetary" },
  { name: "x_studio_output_vat", field_description: "Output VAT SAR", ttype: "monetary" },
  { name: "x_studio_customer_gross_total", field_description: "Customer Gross Total SAR", ttype: "monetary" },
  { name: "x_studio_fx_rate", field_description: "FX Rate Used", ttype: "float" },
  { name: "x_studio_fx_rate_date", field_description: "FX Rate Date", ttype: "date" },
  { name: "x_studio_fx_source", field_description: "FX Source", ttype: "char" },
  { name: "x_studio_fx_snapshot_at", field_description: "FX Snapshot At", ttype: "datetime" },
];
const quoteFields = [
  { name: "x_studio_idempotency_key", field_description: "Quote Operation Key", ttype: "char", index: true, copy: false },
  { name: "x_studio_webhook_event_id", field_description: "Inbound Webhook Event ID", ttype: "char", index: true, copy: false },
  { name: "x_studio_total_price_sar", field_description: "Quote SAR Snapshot", ttype: "monetary" },
  { name: "x_studio_fx_rate", field_description: "FX Rate Used", ttype: "float" },
  { name: "x_studio_fx_rate_date", field_description: "FX Rate Date", ttype: "date" },
  { name: "x_studio_fx_source", field_description: "FX Source", ttype: "char" },
  { name: "x_studio_fx_snapshot_at", field_description: "FX Snapshot At", ttype: "datetime" },
  { name: "x_studio_tax_inclusion_state", field_description: "Tax Inclusion State", ttype: "selection", selection: "[('included','Included'),('excluded','Excluded'),('unknown','Unknown')]" },
  { name: "x_studio_delivery_inclusion_state", field_description: "Delivery Inclusion State", ttype: "selection", selection: "[('included','Included'),('excluded','Excluded'),('unknown','Unknown')]" },
];
const communicationFields = [
  { name: "x_studio_rfq_correlation", field_description: "RFQ Reply Correlation", ttype: "char", index: true, copy: false },
];
const outboxFields = [
  { name: "x_studio_idempotency_key", field_description: "Outbox Operation Key", ttype: "char", index: true, copy: false },
];
const approvalFields = [
  { name: "x_studio_idempotency_key", field_description: "Approval Operation Key", ttype: "char", index: true, copy: false },
];
const report = { created: [], existing: [] };
for (const [model, fieldsForModel] of [["x_build_procurement_request", fields], ["x_build_supplier_quote", quoteFields], ["x_build_ai_communication", communicationFields], ["x_build_integration_outbox", outboxFields], ["x_build_ai_approval", approvalFields]]) {
  const modelId = modelByName.get(model);
  for (const field of fieldsForModel) {
    const exists = await kw("ir.model.fields", "search_read", [[ ["model_id", "=", modelId], ["name", "=", field.name] ]], { fields: ["id"], limit: 1 });
    if (!exists.length) {
      await kw("ir.model.fields", "create", [{ ...field, model_id: modelId, state: "manual" }]);
      report.created.push(`${model}.${field.name}`);
    } else report.existing.push(`${model}.${field.name}`);
  }
}
console.log(JSON.stringify({ target: "staging", fields_created: report.created, fields_already_present: report.existing, safety: "Only Studio metadata fields were created; no business records, emails, RFQs, cron jobs, or automation actions were invoked. Redis is the authoritative atomic idempotency layer." }, null, 2));
