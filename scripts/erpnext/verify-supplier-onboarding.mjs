/**
 * Verify supplier onboarding flow in ERPNext.
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/verify-supplier-onboarding.mjs
 */

const BASE_URL = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const API_TOKEN = process.env.ERPNEXT_API_TOKEN;

if (!API_TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const headers = {
  Authorization: `token ${API_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const stamp = Date.now();
const results = [];

function pass(step, detail) {
  results.push({ ok: true, step, detail });
  console.log(`  ✅ ${step}: ${detail}`);
}

function fail(step, detail) {
  results.push({ ok: false, step, detail });
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
    throw new Error(`${method} ${path} → ${res.status}: ${data?.exception || data?.message || text}`.slice(0, 400));
  }
  return data?.data ?? data?.message ?? data;
}

function stageUpdates(stage) {
  const today = new Date().toISOString().slice(0, 10);
  const base = { build_review_date: today, build_reviewed_by: "partner@build.sa" };
  if (stage === "Approved") {
    return {
      ...base,
      supplier_group: "Build Approved Suppliers",
      build_verification_status: "Verified",
      build_preferred_for_rfq: 1,
      build_rfq_priority: "Preferred",
    };
  }
  if (stage === "Rejected") {
    return {
      ...base,
      supplier_group: "Build Rejected Suppliers",
      build_verification_status: "Failed",
      build_preferred_for_rfq: 0,
      build_rfq_priority: "Do Not Use",
    };
  }
  if (stage === "Under Review") {
    return { ...base, build_verification_status: "Pending" };
  }
  return {};
}

async function applyWorkflow(name, action) {
  const doc = await api("GET", `/api/resource/Supplier/${encodeURIComponent(name)}`);
  const updated = await api("POST", "/api/method/frappe.model.workflow.apply_workflow", { doc, action });
  const updates = stageUpdates(updated.build_supplier_stage);
  if (Object.keys(updates).length) {
    await api("PUT", `/api/resource/Supplier/${encodeURIComponent(name)}`, updates);
    return api("GET", `/api/resource/Supplier/${encodeURIComponent(name)}`);
  }
  return updated;
}

async function main() {
  console.log(`\nSupplier Onboarding Verification — ${BASE_URL}\n`);

  const supplierName = `مورد اختبار ${stamp}`;

  let supplier;
  try {
    supplier = await api("POST", "/api/resource/Supplier", {
      supplier_name: supplierName,
      supplier_type: "Company",
      supplier_group: "Build Pre-Registered Suppliers",
      build_supplier_stage: "Pre Registration",
      build_website_source: 1,
      build_profile_completed: 0,
      build_manager_name: "أحمد اختبار",
      build_contact_number: "0551000001",
      build_email: `supplier-${stamp}@build.sa`,
      build_cr_number: String(1000000000 + (stamp % 899999999)),
    });
    pass("Create supplier", supplier.name);
  } catch (e) {
    fail("Create supplier", e.message);
    return summarize();
  }

  try {
    const reviewed = await applyWorkflow(supplier.name, "Review");
    if (reviewed.build_supplier_stage === "Under Review" && reviewed.build_verification_status === "Pending") {
      pass("Review workflow", reviewed.build_supplier_stage);
    } else {
      fail("Review workflow", `stage=${reviewed.build_supplier_stage}, verification=${reviewed.build_verification_status}`);
    }
  } catch (e) {
    fail("Review workflow", e.message);
    return summarize();
  }

  try {
    const approved = await applyWorkflow(supplier.name, "Approve");
    const checks = [
      approved.build_supplier_stage === "Approved",
      approved.supplier_group === "Build Approved Suppliers",
      approved.build_verification_status === "Verified",
      approved.build_preferred_for_rfq === 1,
      approved.build_rfq_priority === "Preferred",
      Boolean(approved.build_review_date),
      Boolean(approved.build_reviewed_by),
    ];
    if (checks.every(Boolean)) {
      pass("Approve automation", `group=${approved.supplier_group}, rfq=${approved.build_rfq_priority}`);
    } else {
      fail("Approve automation", JSON.stringify({
        stage: approved.build_supplier_stage,
        group: approved.supplier_group,
        verification: approved.build_verification_status,
        preferred: approved.build_preferred_for_rfq,
        priority: approved.build_rfq_priority,
      }));
    }
  } catch (e) {
    fail("Approve automation", e.message);
    return summarize();
  }

  // Reject path on a second supplier
  const rejectName = `مورد رفض ${stamp}`;
  try {
    const rejectSupplier = await api("POST", "/api/resource/Supplier", {
      supplier_name: rejectName,
      supplier_type: "Company",
      supplier_group: "Build Pre-Registered Suppliers",
      build_supplier_stage: "Pre Registration",
      build_website_source: 1,
      build_manager_name: "خالد اختبار",
      build_email: `reject-${stamp}@build.sa`,
      build_cr_number: String(2000000000 + (stamp % 799999999)),
      build_vendor_type: "مصنع",
      build_product_categories: "كهرباء",
      build_coverage_regions: "جدة",
    });
    await applyWorkflow(rejectSupplier.name, "Review");
    const rejected = await applyWorkflow(rejectSupplier.name, "Reject");
    if (
      rejected.build_supplier_stage === "Rejected" &&
      rejected.supplier_group === "Build Rejected Suppliers" &&
      rejected.build_verification_status === "Failed"
    ) {
      pass("Reject automation", rejected.supplier_group);
    } else {
      fail("Reject automation", JSON.stringify(rejected));
    }
  } catch (e) {
    fail("Reject automation", e.message);
  }

  try {
    const notifications = await api(
      "GET",
      `/api/resource/Notification?fields=${encodeURIComponent(JSON.stringify(["name", "enabled"]))}&filters=${encodeURIComponent(
        JSON.stringify([
          ["Notification", "name", "like", "%Build Supplier%"],
        ])
      )}`
    );
    const approvedEmail = notifications?.find((n) => n.name === "Build Supplier Approved Email");
    const others = notifications?.filter((n) => n.name !== "Build Supplier Approved Email") || [];
    if (
      Array.isArray(notifications) &&
      notifications.length >= 3 &&
      approvedEmail &&
      approvedEmail.enabled === 0 &&
      others.every((n) => n.enabled)
    ) {
      pass("ERPNext notifications", "Approved email disabled; others enabled");
    } else {
      fail("ERPNext notifications", JSON.stringify(notifications));
    }
  } catch (e) {
    fail("ERPNext notifications", e.message);
  }

  try {
    const script = await api("GET", "/api/resource/Client%20Script/Build%20Supplier%20Next%20Action?fields=%5B%22enabled%22%5D");
    if (script.enabled) {
      pass("Client script", "Build Supplier Next Action");
    } else {
      fail("Client script", "disabled");
    }
  } catch (e) {
    fail("Client script", e.message);
  }

  try {
    const fields = await api(
      "GET",
      `/api/resource/Custom%20Field?fields=${encodeURIComponent(JSON.stringify(["fieldname"]))}&filters=${encodeURIComponent(
        JSON.stringify([["Custom Field", "dt", "=", "Supplier"], ["Custom Field", "fieldname", "in", ["build_profile_completed", "build_bank_name", "build_iban"]]])
      )}`
    );
    if (Array.isArray(fields) && fields.length >= 3) {
      pass("Two-phase custom fields", fields.map((f) => f.fieldname).join(", "));
    } else {
      fail("Two-phase custom fields", JSON.stringify(fields));
    }
  } catch (e) {
    fail("Two-phase custom fields", e.message);
  }

  try {
    const webhook = await api("GET", "/api/resource/Webhook/Build%20Supplier%20Approved%20Webhook");
    const json = webhook.webhook_json || "";
    if (json.includes("supplier_id")) {
      pass("Approved webhook payload", "includes supplier_id");
    } else {
      fail("Approved webhook payload", "missing supplier_id");
    }
  } catch (e) {
    fail("Approved webhook payload", e.message);
  }

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