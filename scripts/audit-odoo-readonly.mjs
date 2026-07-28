import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
  }
}

let uid;
let rpcId = 0;

async function rpc(service, method, args) {
  const response = await fetch(`${process.env.ODOO_BASE_URL.replace(/\/$/, "")}/jsonrpc`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: ++rpcId,
    }),
  });
  const result = await response.json();
  if (result.error) throw new Error(result.error.data?.message || result.error.message);
  return result.result;
}

async function execute(model, method, args, kwargs = {}) {
  return rpc("object", "execute_kw", [
    process.env.ODOO_DATABASE,
    uid,
    process.env.ODOO_API_KEY,
    model,
    method,
    args,
    kwargs,
  ]);
}

uid = await rpc("common", "login", [
  process.env.ODOO_DATABASE,
  process.env.ODOO_USERNAME,
  process.env.ODOO_API_KEY,
]);

const models = [
  "x_build_procurement_request",
  "x_build_request_line",
  "x_build_supplier_quote",
  "x_build_supplier_quote_line",
  "x_build_integration_outbox",
  "x_build_ai_communication",
  "x_build_supplier_profile",
  "x_build_carrier_profile",
];

for (const model of models) {
  const fields = await execute(model, "fields_get", [], {
    attributes: ["string", "type", "required", "readonly"],
  });
  const relevant = Object.keys(fields)
    .filter((name) =>
      /submission|idempot|tracking|currency|price|cost|margin|tax|request_id|partner_id|quote_type|status/.test(name)
    )
    .sort();
  console.log("MODEL", model, "FIELDS", relevant.join(","));
  console.log("COUNT", await execute(model, "search_count", [[]]));
}

for (const currency of ["SAR", "USD", "EUR"]) {
  const rows = await execute(
    "res.currency",
    "search_read",
    [[["name", "=", currency]]],
    { fields: ["name", "rate", "active"], limit: 1 }
  );
  console.log("CURRENCY", JSON.stringify(rows));
}

const currencyRates = await execute(
  "res.currency.rate",
  "search_read",
  [[["currency_id.name", "in", ["SAR", "USD", "EUR"]]]],
  { fields: ["name", "rate", "currency_id", "company_id"], order: "name desc", limit: 20 }
);
console.log("CURRENCY_RATES", JSON.stringify(currencyRates));

const modelRows = await execute(
  "ir.model",
  "search_read",
  [[["model", "in", ["x_build_procurement_request", "x_build_supplier_quote", "x_build_integration_outbox"]]]],
  { fields: ["id", "model"], limit: 10 }
);
const modelIds = modelRows.map((row) => row.id);
const constraints = modelIds.length
  ? await execute(
      "ir.model.constraint",
      "search_read",
      [[["model", "in", modelIds]]],
      { fields: ["name", "definition", "model"], limit: 100 }
    )
  : [];
console.log("CONSTRAINTS", JSON.stringify(constraints));

const allModelRows = await execute(
  "ir.model",
  "search_read",
  [[["model", "in", models]]],
  { fields: ["id", "model"], limit: 50 }
);
const allModelIds = allModelRows.map((row) => row.id);
try {
  const access = await execute(
    "ir.model.access",
    "search_read",
    [[["model_id", "in", allModelIds]]],
    { fields: ["name", "model_id", "group_id", "perm_read", "perm_write", "perm_create", "perm_unlink"], limit: 200 }
  );
  console.log("ACCESS", JSON.stringify(access));
  const rules = await execute(
    "ir.rule",
    "search_read",
    [[["model_id", "in", allModelIds]]],
    { fields: ["name", "model_id", "groups", "domain_force", "perm_read", "perm_write", "perm_create", "perm_unlink"], limit: 200 }
  );
  console.log("RULES", JSON.stringify(rules));
} catch (error) {
  console.log("ACCESS_RULES_UNVERIFIED", error.message);
}

const company = await execute(
  "res.company",
  "search_read",
  [[]],
  { fields: ["name", "currency_id", "country_id"], limit: 10 }
);
console.log("COMPANY", JSON.stringify(company));

try {
  const serverActions = await execute(
    "ir.actions.server",
    "search_read",
    [[["id", "in", [929]]]],
    { fields: ["name", "model_id", "state", "code"], limit: 5 }
  );
  console.log("SERVER_ACTIONS", JSON.stringify(serverActions));
} catch (error) {
  console.log("SERVER_ACTIONS_UNVERIFIED", error.message);
}
