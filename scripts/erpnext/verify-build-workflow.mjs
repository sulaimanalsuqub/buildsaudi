/**
 * End-to-end verification of Build.sa ERPNext workflow.
 * Creates a test request and walks through Lead → Opportunity → RFQ → SQ → Quotation → SO → PO → Fulfilled.
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/verify-build-workflow.mjs
 */

const BASE_URL = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const API_TOKEN = process.env.ERPNEXT_API_TOKEN;

if (!API_TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const headers = {
  Authorization: `token ${API_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const results = [];
const stamp = Date.now();

function pass(step, detail) {
  results.push({ step, ok: true, detail });
  console.log(`  ✅ ${step}: ${detail}`);
}

function fail(step, detail) {
  results.push({ step, ok: false, detail });
  console.log(`  ❌ ${step}: ${detail}`);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const msg = data?.exception || data?.message || text;
    throw new Error(`${method} ${path} → ${res.status}: ${typeof msg === "string" ? msg.slice(0, 500) : JSON.stringify(msg).slice(0, 500)}`);
  }
  return data?.data ?? data?.message ?? data;
}

async function getDoc(doctype, name) {
  return api("GET", `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
}

async function createDoc(doctype, data) {
  return api("POST", `/api/resource/${encodeURIComponent(doctype)}`, data);
}

async function applyWorkflow(doctype, name, action) {
  const doc = await getDoc(doctype, name);
  return api("POST", "/api/method/frappe.model.workflow.apply_workflow", { doc, action });
}

async function main() {
  console.log(`\nBuild Workflow Verification — ${BASE_URL}\n`);

  let lead;
  let opportunity;
  let rfq;
  let supplierQuotation;
  let quotation;
  let salesOrder;
  let purchaseOrder;

  const supplierName = "Build Test Supplier ERPNext";
  const today = new Date().toISOString().slice(0, 10);

  // 1. Ping
  try {
    await api("GET", "/api/method/ping");
    pass("API connectivity", "ping OK");
  } catch (e) {
    fail("API connectivity", e.message);
    return summarize();
  }

  // 2. Lead
  try {
    lead = await createDoc("Lead", {
      lead_name: `Workflow Verify ${stamp}`,
      company_name: `Workflow Verify ${stamp}`,
      email_id: `verify-${stamp}@build.sa`,
      mobile_no: "0509999999",
      status: "Lead",
    });
    pass("Create Lead", lead.name);
  } catch (e) {
    fail("Create Lead", e.message);
    return summarize();
  }

  // 3. Opportunity (website flow)
  try {
    opportunity = await createDoc("Opportunity", {
      doctype: "Opportunity",
      opportunity_from: "Lead",
      party_name: lead.name,
      title: `Workflow Verify ${stamp}`,
      opportunity_type: "Build Product Request",
      company: "ايفاد",
      transaction_date: today,
      build_request_source: "Build Website",
      build_request_stage: "New Product Request",
      build_project_name: `Workflow Verify ${stamp}`,
      build_contact_phone: "0509999999",
      build_contact_email: `verify-${stamp}@build.sa`,
      build_delivery_address: "الرياض",
      build_delivery_date: today,
      build_required_materials: "100 طن حديد، 50 كيس أسمنت",
      build_customer_notes: "اختبار تلقائي لسير العملية",
      build_material_extraction_status: "Needs Review",
    });
    pass("Create Opportunity", `${opportunity.name} stage=${opportunity.build_request_stage}`);
  } catch (e) {
    fail("Create Opportunity", e.message);
    return summarize();
  }

  // 4. Workflow transitions
  const workflowSteps = [
    ["Start Review", "Reviewing Request"],
    ["Source Suppliers", "Sourcing Suppliers"],
  ];
  for (const [action, expected] of workflowSteps) {
    try {
      const updated = await applyWorkflow("Opportunity", opportunity.name, action);
      if (updated.build_request_stage === expected) {
        pass(`Workflow: ${action}`, updated.build_request_stage);
      } else {
        fail(`Workflow: ${action}`, `expected ${expected}, got ${updated.build_request_stage}`);
      }
    } catch (e) {
      fail(`Workflow: ${action}`, e.message);
      return summarize();
    }
  }

  // 5. RFQ
  try {
    rfq = await createDoc("Request for Quotation", {
      doctype: "Request for Quotation",
      company: "ايفاد",
      transaction_date: today,
      schedule_date: today,
      build_opportunity: opportunity.name,
      build_project_name: opportunity.build_project_name,
      build_customer_name: lead.lead_name,
      build_contact_phone: "0509999999",
      build_delivery_address: "الرياض",
      build_delivery_date: today,
      build_required_materials: opportunity.build_required_materials,
      message_for_supplier: "يرجى تزويدنا بعرض سعر",
      suppliers: [{ supplier: supplierName }],
      items: [
        {
          item_code: "BUILD-MATERIALS-REQUEST",
          description: opportunity.build_required_materials,
          qty: 1,
          uom: "Nos",
          stock_uom: "Nos",
          conversion_factor: 1,
          schedule_date: today,
        },
      ],
    });
    pass("Create RFQ", `${rfq.name} linked to ${rfq.build_opportunity}`);
  } catch (e) {
    fail("Create RFQ", e.message);
    return summarize();
  }

  // 6. Supplier Quotation
  try {
    supplierQuotation = await createDoc("Supplier Quotation", {
      doctype: "Supplier Quotation",
      supplier: supplierName,
      company: "ايفاد",
      transaction_date: today,
      valid_till: today,
      build_opportunity: opportunity.name,
      build_rfq: rfq.name,
      build_delivery_lead_time: "7 أيام",
      items: [
        {
          item_code: "BUILD-MATERIALS-REQUEST",
          description: opportunity.build_required_materials,
          qty: 1,
          uom: "Nos",
          rate: 1000,
          amount: 1000,
        },
      ],
    });
    pass("Create Supplier Quotation", `${supplierQuotation.name} total=${supplierQuotation.grand_total ?? 1000}`);
  } catch (e) {
    fail("Create Supplier Quotation", e.message);
    return summarize();
  }

  // 7. Customer Quotation (with service fee)
  try {
    const supplierCost = 1000;
    const serviceFee = 150;
    quotation = await createDoc("Quotation", {
      doctype: "Quotation",
      quotation_to: "Lead",
      party_name: lead.name,
      customer_name: lead.lead_name,
      company: "ايفاد",
      transaction_date: today,
      valid_till: today,
      build_opportunity: opportunity.name,
      build_supplier_quotation: supplierQuotation.name,
      build_supplier_cost: supplierCost,
      build_service_fee_type: "Fixed Amount",
      build_service_fee_amount: serviceFee,
      items: [
        {
          item_code: "BUILD-MATERIALS-REQUEST",
          description: opportunity.build_required_materials,
          qty: 1,
          uom: "Nos",
          rate: supplierCost + serviceFee,
          amount: supplierCost + serviceFee,
        },
      ],
    });
    pass("Create Customer Quotation", `${quotation.name} grand_total=${quotation.grand_total}`);
  } catch (e) {
    fail("Create Customer Quotation", e.message);
    return summarize();
  }

  // 8. Customer + Sales Order
  let customer;
  try {
    customer = await createDoc("Customer", {
      customer_name: lead.lead_name,
      customer_type: "Company",
      customer_group: "Commercial",
      territory: "Saudi Arabia",
      lead_name: lead.name,
    });
    pass("Create Customer", customer.name);
  } catch (e) {
    fail("Create Customer", e.message);
    return summarize();
  }

  try {
    salesOrder = await createDoc("Sales Order", {
      doctype: "Sales Order",
      company: "ايفاد",
      customer: customer.name,
      customer_name: lead.lead_name,
      transaction_date: today,
      delivery_date: today,
      build_opportunity: opportunity.name,
      build_customer_quotation: quotation.name,
      build_supplier_quotation: supplierQuotation.name,
      build_fulfillment_method: "Drop Ship",
      build_delivery_status: "Pending",
      items: [
        {
          item_code: "BUILD-MATERIALS-REQUEST",
          qty: 1,
          uom: "Nos",
          rate: 1150,
          delivery_date: today,
          delivered_by_supplier: 1,
          supplier: supplierName,
        },
      ],
    });
    pass("Create Sales Order", `${salesOrder.name} status=${salesOrder.build_delivery_status}`);
  } catch (e) {
    fail("Create Sales Order", e.message);
    return summarize();
  }

  // 9. Purchase Order
  try {
    purchaseOrder = await createDoc("Purchase Order", {
      doctype: "Purchase Order",
      supplier: supplierName,
      company: "ايفاد",
      transaction_date: today,
      schedule_date: today,
      build_opportunity: opportunity.name,
      build_sales_order: salesOrder.name,
      build_customer_quotation: quotation.name,
      build_supplier_quotation: supplierQuotation.name,
      build_fulfillment_method: "Drop Ship",
      build_supplier_delivery_status: "Pending",
      items: [
        {
          item_code: "BUILD-MATERIALS-REQUEST",
          qty: 1,
          uom: "Nos",
          rate: 1000,
          schedule_date: today,
        },
      ],
    });
    pass("Create Purchase Order", `${purchaseOrder.name}`);
  } catch (e) {
    fail("Create Purchase Order", e.message);
    return summarize();
  }

  // 10. Delivery status → Fulfilled
  try {
    await api("PUT", `/api/resource/Purchase%20Order/${encodeURIComponent(purchaseOrder.name)}`, {
      build_supplier_delivery_status: "Delivered",
      build_delivery_notes: "اختبار تلقائي — تم التسليم",
    });
    await api("PUT", `/api/resource/Sales%20Order/${encodeURIComponent(salesOrder.name)}`, {
      build_delivery_status: "Delivered",
    });

    const deliveredActions = ["Send Quote", "Mark Fulfilled"];
    for (const action of deliveredActions) {
      const opp = await getDoc("Opportunity", opportunity.name);
      if (opp.build_request_stage !== action === "Mark Fulfilled" ? "Fulfilled" : opp.build_request_stage) {
        try {
          await applyWorkflow("Opportunity", opportunity.name, action);
        } catch {
          // may already be past this stage
        }
      }
    }

    // Force correct path to Fulfilled
    let opp = await getDoc("Opportunity", opportunity.name);
    const path = [
      ["Send Quote", "Quoted to Customer"],
      ["Mark Fulfilled", "Fulfilled"],
    ];
    for (const [action, expected] of path) {
      if (opp.build_request_stage === expected) continue;
      try {
        opp = await applyWorkflow("Opportunity", opportunity.name, action);
      } catch (e) {
        // try next
      }
    }
    opp = await getDoc("Opportunity", opportunity.name);

    if (opp.build_request_stage === "Fulfilled") {
      pass("Delivery → Fulfilled", `Opportunity ${opp.name} = ${opp.build_request_stage}`);
    } else {
      fail("Delivery → Fulfilled", `stuck at ${opp.build_request_stage}`);
    }
  } catch (e) {
    fail("Delivery → Fulfilled", e.message);
  }

  // 11. Supplier workflow
  try {
    const supplier = await getDoc("Supplier", supplierName);
    if (supplier.build_supplier_stage === "Pre Registration") {
      const reviewed = await applyWorkflow("Supplier", supplierName, "Review");
      const approved = await applyWorkflow("Supplier", supplierName, "Approve");
      if (approved.build_supplier_stage === "Approved") {
        pass("Supplier workflow", `Pre Registration → ${approved.build_supplier_stage}`);
      } else {
        fail("Supplier workflow", `expected Approved, got ${approved.build_supplier_stage}`);
      }
    } else {
      pass("Supplier workflow", `already at ${supplier.build_supplier_stage}`);
    }
  } catch (e) {
    fail("Supplier workflow", e.message);
  }

  // 12. Link integrity
  try {
    const po = await getDoc("Purchase Order", purchaseOrder.name);
    const so = await getDoc("Sales Order", salesOrder.name);
    const checks = [
      po.build_opportunity === opportunity.name,
      po.build_sales_order === salesOrder.name,
      so.build_opportunity === opportunity.name,
      so.build_customer_quotation === quotation.name,
    ];
    if (checks.every(Boolean)) {
      pass("Document linking", "SO ↔ PO ↔ Opportunity ↔ Quotation chain intact");
    } else {
      fail("Document linking", JSON.stringify({ po_opp: po.build_opportunity, so_opp: so.build_opportunity }));
    }
  } catch (e) {
    fail("Document linking", e.message);
  }

  console.log(`\n  Test Opportunity: ${opportunity?.name}`);
  summarize();
}

function summarize() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n── Summary: ${passed} passed, ${failed} failed ──\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});