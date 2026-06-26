/**
 * Two-phase vendor onboarding: custom fields + disable duplicate approval email.
 * Phase 1 = basic registration on website; Phase 2 = complete profile after admin approval.
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-vendor-two-phase.mjs
 */

const BASE = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const TOKEN = process.env.ERPNEXT_API_TOKEN;
if (!TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const H = { Authorization: `token ${TOKEN}`, "Content-Type": "application/json", Accept: "application/json" };

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let d;
  try {
    d = JSON.parse(t);
  } catch {
    d = { raw: t };
  }
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${d?.exception || d?.message || t}`);
  return d?.data ?? d?.message ?? d;
}

async function upsert(dt, name, doc) {
  try {
    await api("GET", `/api/resource/${encodeURIComponent(dt)}/${encodeURIComponent(name)}`);
    await api("PUT", `/api/resource/${encodeURIComponent(dt)}/${encodeURIComponent(name)}`, doc);
  } catch {
    await api("POST", `/api/resource/${encodeURIComponent(dt)}`, { ...doc, name });
  }
  console.log(`  ✓ ${name}`);
}

const PROFILE_FIELDS = [
  {
    dt: "Supplier",
    fieldname: "build_profile_section",
    fieldtype: "Section Break",
    label: "Build Profile Completion",
    insert_after: "build_gov_projects",
  },
  {
    dt: "Supplier",
    fieldname: "build_profile_completed",
    fieldtype: "Check",
    label: "Profile Completed",
    insert_after: "build_profile_section",
    default: "0",
  },
  {
    dt: "Supplier",
    fieldname: "build_profile_completed_at",
    fieldtype: "Datetime",
    label: "Profile Completed At",
    insert_after: "build_profile_completed",
    read_only: 1,
  },
  {
    dt: "Supplier",
    fieldname: "build_bank_name",
    fieldtype: "Data",
    label: "Bank Name",
    insert_after: "build_profile_completed_at",
  },
  {
    dt: "Supplier",
    fieldname: "build_iban",
    fieldtype: "Data",
    label: "IBAN",
    insert_after: "build_bank_name",
  },
  {
    dt: "Supplier",
    fieldname: "build_cr_document_url",
    fieldtype: "Data",
    label: "CR Document URL",
    insert_after: "build_iban",
    read_only: 1,
  },
  {
    dt: "Supplier",
    fieldname: "build_bank_letter_url",
    fieldtype: "Data",
    label: "Bank Letter URL",
    insert_after: "build_cr_document_url",
    read_only: 1,
  },
];

async function disableDuplicateApprovalEmail() {
  try {
    await api("PUT", `/api/resource/Notification/${encodeURIComponent("Build Supplier Approved Email")}`, {
      enabled: 0,
    });
    console.log("  ✕ disabled Build Supplier Approved Email (website sends journey email via webhook)");
  } catch (e) {
    console.log(`  ⚠ Could not disable Build Supplier Approved Email: ${e.message}`);
  }
}

async function patchSupplierClientScript() {
  const name = "Build Supplier Next Action";
  let script;
  try {
    script = await api("GET", `/api/resource/Client%20Script/${encodeURIComponent(name)}`);
  } catch {
    console.log("  ⚠ Client Script not found — run setup-build-supplier-onboarding-automation.mjs first");
    return;
  }

  const updated = (script.script || "")
    .replace(
      /Approved:\s*\{[\s\S]*?steps:\s*\[[^\]]*\]/,
      `Approved: {
        msg: "✅ مورد معتمد — ينتظر إكمال ملف التوريد من الموقع",
        color: "#e3f2fd",
        steps: ["يصل المورد بريد «رحلة توريد منتجاتك بدأت»", "بعد إكمال الملف يظهر في اقتراحات RFQ", "أضفه في طلبات RFQ عند الجاهزية"]`
    )
    .replace(
      /"يصله بريد تفعيل تلقائياً"/g,
      '"يصله بريد رابط إكمال الملف تلقائياً"'
    );

  if (updated !== script.script) {
    await api("PUT", `/api/resource/Client%20Script/${encodeURIComponent(name)}`, { script: updated });
    console.log("  ✓ updated Build Supplier Next Action copy for two-phase flow");
  } else {
    console.log("  ↻ Build Supplier Next Action already reflects two-phase flow");
  }
}

async function main() {
  console.log(`\nBuild Vendor Two-Phase — ${BASE}\n`);

  console.log("── Supplier Custom Fields ──");
  for (const f of PROFILE_FIELDS) {
    await upsert("Custom Field", `${f.dt}-${f.fieldname}`, { ...f, module: "Custom" });
  }

  console.log("\n── Notifications ──");
  await disableDuplicateApprovalEmail();

  console.log("\n── Client Script ──");
  await patchSupplierClientScript();

  console.log("\n✅ Two-phase vendor fields active.\n");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});