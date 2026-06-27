/**
 * Re-extract BOQ items for an existing opportunity.
 *
 * Run: npx tsx scripts/reprocess-opportunity-extract.ts CRM-OPP-2026-00023
 */

import { readFileSync } from "fs";
import { resolve } from "path";

for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i > 0) process.env[line.slice(0, i)] = line.slice(i + 1);
}

import { getERPNextDocument } from "../lib/erpnext";
import { processQuoteBackground } from "../lib/process-quote-background";

async function main() {
const opportunityName = process.argv[2];
if (!opportunityName) {
  console.error("Usage: npx tsx scripts/reprocess-opportunity-extract.ts <OPP_NAME>");
  process.exit(1);
}

const opp = await getERPNextDocument<{
  name: string;
  build_project_name?: string;
  build_contact_email?: string;
  build_contact_phone?: string;
  build_delivery_address?: string;
  build_required_materials?: string;
  build_boq_file_url?: string;
  party_name?: string;
}>("Opportunity", opportunityName);

if (!opp) {
  console.error("Opportunity not found:", opportunityName);
  process.exit(1);
}

const lead = opp.party_name
  ? await getERPNextDocument<{ lead_name?: string }>("Lead", opp.party_name)
  : null;

await processQuoteBackground({
  opportunityName,
  project_name: opp.build_project_name || opportunityName,
  client_name: lead?.lead_name || opp.party_name || "عميل",
  phone: opp.build_contact_phone || "",
  client_email: opp.build_contact_email,
  delivery_address: opp.build_delivery_address || "",
  materials: opp.build_required_materials || "",
  boq_file_url: opp.build_boq_file_url,
});

const updated = await getERPNextDocument<{
  build_extracted_material_items?: Array<{ build_item_name: string; build_quantity: number; build_uom: string }>;
  build_material_extraction_summary?: string;
}>("Opportunity", opportunityName);

const items = updated?.build_extracted_material_items || [];
console.log(`\n✅ ${opportunityName}: ${items.length} item(s)`);
console.log(updated?.build_material_extraction_summary || "");
for (const item of items.slice(0, 15)) {
  console.log(` - ${item.build_item_name} | ${item.build_quantity} ${item.build_uom}`);
}
if (items.length > 15) console.log(` ... +${items.length - 15} more`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});