/*
 * Deliberately not run automatically.  Applies the Odoo Studio schema required by
 * the final-launch remediation branch. Run only against a staging clone first.
 * It creates fields; it never touches business records.
 */
import fs from "node:fs";
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
if (process.env.CONFIRM_ODOO_SCHEMA_MIGRATION !== "yes") throw new Error("Set CONFIRM_ODOO_SCHEMA_MIGRATION=yes explicitly");
let id = 0; let uid;
async function rpc(service, method, args) {
  const response = await fetch(`${process.env.ODOO_BASE_URL.replace(/\/$/, "")}/jsonrpc`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: ++id }) });
  const json = await response.json(); if (json.error) throw new Error(json.error.data?.message || json.error.message); return json.result;
}
async function kw(model, method, args, kwargs = {}) { return rpc("object", "execute_kw", [process.env.ODOO_DATABASE, uid, process.env.ODOO_API_KEY, model, method, args, kwargs]); }
uid = await rpc("common", "login", [process.env.ODOO_DATABASE, process.env.ODOO_USERNAME, process.env.ODOO_API_KEY]);
const models = await kw("ir.model", "search_read", [[ ["model", "in", ["x_build_procurement_request", "x_build_supplier_quote", "x_build_ai_communication"]] ]], { fields: ["id", "model"], limit: 3 });
const modelByName = new Map(models.map((row) => [row.model, row.id]));
if (!modelByName.get("x_build_procurement_request") || !modelByName.get("x_build_supplier_quote") || !modelByName.get("x_build_ai_communication")) throw new Error("Required Build models missing");
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
for (const [model, fieldsForModel] of [["x_build_procurement_request", fields], ["x_build_supplier_quote", quoteFields], ["x_build_ai_communication", communicationFields]]) {
  const modelId = modelByName.get(model);
  for (const field of fieldsForModel) {
    const exists = await kw("ir.model.fields", "search_read", [[ ["model_id", "=", modelId], ["name", "=", field.name] ]], { fields: ["id"], limit: 1 });
    if (!exists.length) await kw("ir.model.fields", "create", [{ ...field, model_id: modelId, state: "manual" }]);
  }
}
console.log("Schema fields ensured. Studio fields cannot provide a database UNIQUE constraint. Durable submission/event claims remain in Redis; a managed Odoo custom module must add UNIQUE constraints for x_studio_submission_key, x_studio_idempotency_key, and x_studio_rfq_correlation before production launch.");
