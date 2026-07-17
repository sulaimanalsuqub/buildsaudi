/**
 * Foundation fixes: workflow allow_edit, module profile, permissions,
 * assignment rules, agent custom fields, webhooks, broken script cleanup.
 *
 * Run: ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-foundation.mjs
 */

const BASE = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const TOKEN = process.env.ERPNEXT_API_TOKEN;
const WEBHOOK_SECRET = process.env.ERPNEXT_WEBHOOK_SECRET || "";
const WEBHOOK_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.build.sa").replace(/\/$/, "") + "/api/webhooks/erpnext";

if (!TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const H = { Authorization: `token ${TOKEN}`, "Content-Type": "application/json", Accept: "application/json" };
const BUILD_TEAM = "Build Team";
const BUILD_ROLES = ["Build Manager", "Build Operations"];

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = { raw: t }; }
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${d?.exception || d?.message || t}`);
  return d?.data ?? d?.message ?? d;
}

async function exists(dt, name) {
  try { await api("GET", `/api/resource/${enc(dt)}/${enc(name)}`); return true; }
  catch (e) { if (e.message.includes("404") || e.message.includes("DoesNotExist")) return false; throw e; }
}

async function upsert(dt, name, doc) {
  if (await exists(dt, name)) {
    console.log(`  ↻ ${dt} / ${name}`);
    return api("PUT", `/api/resource/${enc(dt)}/${enc(name)}`, doc);
  }
  console.log(`  + ${dt} / ${name}`);
  return api("POST", `/api/resource/${enc(dt)}`, { ...doc, name });
}

function enc(v) { return encodeURIComponent(v); }

// ─── 1. Build Team role (shared allow_edit) ─────────────────────────────────

async function setupBuildTeamRole() {
  console.log("\n── Build Team Role ──");
  await upsert("Role", BUILD_TEAM, { role_name: BUILD_TEAM, desk_access: 1 });
  for (const email of ["operations@buildsaudi.com", "manager@buildsaudi.com"]) {
    const user = await api("GET", `/api/resource/User/${enc(email)}`);
    const roles = user.roles || [];
    if (!roles.some((r) => r.role === BUILD_TEAM)) {
      roles.push({ role: BUILD_TEAM });
      await api("PUT", `/api/resource/User/${enc(email)}`, { roles });
      console.log(`  ✓ ${email} → Build Team`);
    }
  }
}

// ─── 2. Workflow allow_edit fix ─────────────────────────────────────────────

async function fixWorkflowAllowEdit(name) {
  const wf = await api("GET", `/api/resource/Workflow/${enc(name)}`);
  const states = (wf.states || []).map((s, i) => ({
    ...s,
    idx: s.idx || i + 1,
    allow_edit: BUILD_TEAM,
  }));
  await api("PUT", `/api/resource/Workflow/${enc(name)}`, { states });
  console.log(`  ✓ ${name} — allow_edit → ${BUILD_TEAM} (${states.length} states)`);
}

// ─── 3. Module Profile ──────────────────────────────────────────────────────

const BLOCKED_MODULES = [
  "Accounts", "Assets", "Automation", "Bulk Transaction", "EDI",
  "ERPNext Integrations", "Maintenance", "Manufacturing", "Portal",
  "Projects", "Quality Management", "Subcontracting", "Support",
  "Telephony", "Website", "Workflow",
];

async function setupModuleProfile() {
  console.log("\n── Module Profile ──");
  const profile = {
    module_profile_name: "Build Operations",
    block_modules: BLOCKED_MODULES.map((m, i) => ({ idx: i + 1, module: m })),
  };
  await upsert("Module Profile", "Build Operations", profile);

  for (const email of ["operations@buildsaudi.com", "manager@buildsaudi.com"]) {
    await api("PUT", `/api/resource/User/${enc(email)}`, {
      module_profile: "Build Operations",
      home_settings: JSON.stringify({ workspace: "Build" }),
    });
    console.log(`  ✓ ${email} → Module Profile: Build Operations`);
  }
}

// ─── 4. SO create permission for Build Operations ───────────────────────────

async function fixSalesOrderPermission() {
  console.log("\n── Sales Order Permission ──");
  const rows = await api("GET", `/api/resource/Custom%20DocPerm?filters=${enc(JSON.stringify([
    ["Custom DocPerm", "parent", "=", "Sales Order"],
    ["Custom DocPerm", "role", "=", "Build Operations"],
  ]))}&fields=${enc(JSON.stringify(["name"]))}&limit_page_length=10`);

  for (const row of rows || []) {
    await api("DELETE", `/api/resource/Custom%20DocPerm/${enc(row.name)}`);
  }
  await api("POST", "/api/resource/Custom DocPerm", {
    parent: "Sales Order", parenttype: "DocType", parentfield: "permissions",
    role: "Build Operations", permlevel: 0,
    read: 1, write: 1, create: 1, submit: 1, cancel: 1, amend: 1, report: 1, print: 1, email: 1,
  });
  console.log("  ✓ Build Operations → Sales Order create=1");
}

// ─── 5. Agent custom fields ─────────────────────────────────────────────────

const AGENT_FIELDS = [
  { dt: "Opportunity", fieldname: "build_agent_section", fieldtype: "Section Break", label: "Build Agent", insert_after: "build_customer_notes" },
  { dt: "Opportunity", fieldname: "build_agent_summary", fieldtype: "Long Text", label: "Agent Decision Summary", insert_after: "build_agent_section" },
  { dt: "Opportunity", fieldname: "build_suggested_suppliers", fieldtype: "Long Text", label: "Suggested Suppliers (JSON)", insert_after: "build_agent_summary" },
  { dt: "Opportunity", fieldname: "build_agent_score", fieldtype: "Int", label: "Top Supplier Match Score", insert_after: "build_suggested_suppliers" },
  { dt: "Supplier", fieldname: "build_agent_section", fieldtype: "Section Break", label: "Build Agent", insert_after: "build_rejection_reason" },
  { dt: "Supplier", fieldname: "build_agent_summary", fieldtype: "Long Text", label: "Agent Decision Summary", insert_after: "build_agent_section" },
  { dt: "Supplier", fieldname: "build_agent_score", fieldtype: "Int", label: "Agent Score", insert_after: "build_agent_summary" },
  { dt: "Supplier", fieldname: "build_agent_catalog_groups", fieldtype: "Small Text", label: "Agent Catalog Groups", insert_after: "build_agent_score" },
];

async function setupAgentFields() {
  console.log("\n── Agent Custom Fields ──");
  for (const f of AGENT_FIELDS) {
    const name = `${f.dt}-${f.fieldname}`;
    await upsert("Custom Field", name, { ...f, module: "Custom" });
  }
}

// ─── 6. Assignment Rules ────────────────────────────────────────────────────

async function setupAssignmentRules() {
  console.log("\n── Assignment Rules ──");
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const assignmentDays = weekdays.map((day, i) => ({ idx: i + 1, day }));

  const rule = {
    document_type: "Opportunity",
    priority: 1,
    disabled: 0,
    description: "Assign new Build product requests to operations team",
    assign_condition: 'doc.opportunity_type == "Build Product Request" and doc.build_request_stage == "New Product Request"',
    rule: "Round Robin",
    assignment_days: assignmentDays,
    users: [{ idx: 1, user: "operations@buildsaudi.com" }],
  };
  await upsert("Assignment Rule", "Build New Request Assignment", rule);

  const supRule = {
    document_type: "Supplier",
    priority: 1,
    disabled: 0,
    description: "Assign new supplier registrations to manager",
    assign_condition: 'doc.build_supplier_stage == "Pre Registration" and doc.build_website_source',
    rule: "Round Robin",
    assignment_days: assignmentDays,
    users: [{ idx: 1, user: "manager@buildsaudi.com" }],
  };
  await upsert("Assignment Rule", "Build New Supplier Assignment", supRule);
}

// ─── 7. Disable broken Server Scripts ───────────────────────────────────────

async function cleanupServerScripts() {
  console.log("\n── Server Script Cleanup ──");
  const scripts = await api("GET", `/api/resource/Server%20Script?fields=${enc(JSON.stringify(["name","reference_doctype"]))}&limit_page_length=20`);
  for (const s of scripts || []) {
    if (s.name.startsWith("Build")) {
      await api("PUT", `/api/resource/Server%20Script/${enc(s.name)}`, { disabled: 1 });
      console.log(`  ✕ disabled ${s.name}`);
    }
  }
}

// ─── 8. Opportunity stage notifications (ERPNext-native) ────────────────────

async function setupOpportunityNotifications() {
  console.log("\n── Opportunity Notifications ──");
  // Quoted to Customer is NOT here — quotation email is gated behind manual manager send.
  const stages = [
    { stage: "Reviewing Request", subject: "طلبك قيد المراجعة — {{ doc.build_project_name }}", msg: "فريق Build يبدأ مراجعة طلبك." },
    { stage: "Sourcing Suppliers", subject: "جاري تسعير طلبك — {{ doc.build_project_name }}", msg: "نتواصل مع الموردين للحصول على أفضل الأسعار." },
    { stage: "Fulfilled", subject: "تم تنفيذ طلبك — {{ doc.build_project_name }}", msg: "تم تسليم المواد بنجاح. شكراً لثقتكم." },
  ];

  for (const { stage, subject, msg } of stages) {
    const name = `Build Opp Stage ${stage.replace(/\s/g, "")}`;
    await upsert("Notification", name, {
      enabled: 1,
      channel: "Email",
      event: "Value Change",
      document_type: "Opportunity",
      value_changed: "build_request_stage",
      condition: `doc.build_request_stage == "${stage}" and doc.build_contact_email`,
      subject,
      message_type: "HTML",
      message: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><p>مرحباً،</p><p>${msg}</p><p><strong>المشروع:</strong> {{ doc.build_project_name }}</p><p>مع تحياتنا،<br/>فريق Build Saudi</p></div>`,
      sender: "Build Resend",
      recipients: [{ idx: 1, receiver_by_document_field: "build_contact_email" }],
    });
    console.log(`  ✓ ${name}`);
  }
}

// ─── 9. Webhooks to build.sa (supplier stages) ──────────────────────────────

async function setupWebhooks() {
  if (!WEBHOOK_SECRET) {
    console.log("\n── Webhooks — skipped (no ERPNEXT_WEBHOOK_SECRET) ──");
    return;
  }
  console.log("\n── Webhooks ──");

  const webhooks = [
    // موافقة أولية فقط (قبل إكمال الملف) → رابط /register/complete
    {
      name: "Build Supplier Approved Webhook",
      webhook_doctype: "Supplier",
      webhook_docevent: "on_update",
      enabled: 1,
      request_url: WEBHOOK_URL,
      request_method: "POST",
      request_structure: "JSON",
      webhook_headers: [
        { idx: 1, key: "Content-Type", value: "application/json" },
        { idx: 2, key: "x-webhook-secret", value: WEBHOOK_SECRET },
      ],
      webhook_json: `{
  "event": "supplier.approved",
  "supplier_id": "{{ doc.name }}",
  "supplier_name": "{{ doc.supplier_name }}",
  "manager_name": "{{ doc.build_manager_name }}",
  "email": "{{ doc.build_email }}",
  "profile_completed": "{{ doc.build_profile_completed }}"
}`,
      condition:
        'doc.build_supplier_stage == "Approved" and not doc.build_profile_completed and doc.build_email',
    },
    // اعتماد نهائي بعد اكتمال الملف → إيميل «معتمد لـ RFQ» بدون رابط إكمال
    {
      name: "Build Supplier Fully Approved Webhook",
      webhook_doctype: "Supplier",
      webhook_docevent: "on_update",
      enabled: 1,
      request_url: WEBHOOK_URL,
      request_method: "POST",
      request_structure: "JSON",
      webhook_headers: [
        { idx: 1, key: "Content-Type", value: "application/json" },
        { idx: 2, key: "x-webhook-secret", value: WEBHOOK_SECRET },
      ],
      webhook_json: `{
  "event": "supplier.fully_approved",
  "supplier_id": "{{ doc.name }}",
  "supplier_name": "{{ doc.supplier_name }}",
  "manager_name": "{{ doc.build_manager_name }}",
  "email": "{{ doc.build_email }}"
}`,
      condition:
        'doc.build_supplier_stage == "Approved" and doc.build_profile_completed and doc.build_email',
    },
    {
      name: "Build Supplier Rejected Webhook",
      webhook_doctype: "Supplier",
      webhook_docevent: "on_update",
      enabled: 1,
      request_url: WEBHOOK_URL,
      request_method: "POST",
      request_structure: "JSON",
      webhook_headers: [
        { idx: 1, key: "Content-Type", value: "application/json" },
        { idx: 2, key: "x-webhook-secret", value: WEBHOOK_SECRET },
      ],
      webhook_json: `{
  "event": "supplier.rejected",
  "supplier_id": "{{ doc.name }}",
  "supplier_name": "{{ doc.supplier_name }}",
  "manager_name": "{{ doc.build_manager_name }}",
  "email": "{{ doc.build_email }}",
  "rejection_reason": "{{ doc.build_rejection_reason }}"
}`,
      condition: 'doc.build_supplier_stage == "Rejected" and doc.build_email',
    },
    {
      name: "Build Opportunity Stage Webhook",
      webhook_doctype: "Opportunity",
      webhook_docevent: "on_update",
      enabled: 1,
      request_url: WEBHOOK_URL,
      request_method: "POST",
      request_structure: "JSON",
      webhook_headers: [
        { idx: 1, key: "Content-Type", value: "application/json" },
        { idx: 2, key: "x-webhook-secret", value: WEBHOOK_SECRET },
      ],
      webhook_json: `{
  "event": "opportunity.stage_changed",
  "project_name": "{{ doc.build_project_name }}",
  "client_name": "{{ doc.title }}",
  "client_email": "{{ doc.build_contact_email }}",
  "stage": "{{ doc.build_request_stage }}"
}`,
      condition: 'doc.opportunity_type == "Build Product Request"',
    },
  ];

  for (const wh of webhooks) {
    await upsert("Webhook", wh.name, wh);
    console.log(`  ✓ ${wh.name}`);
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nBuild Foundation Setup — ${BASE}\n`);
  await setupBuildTeamRole();
  console.log("\n── Workflow allow_edit ──");
  await fixWorkflowAllowEdit("Build Product Request Workflow");
  await fixWorkflowAllowEdit("Build Supplier Onboarding");
  await setupModuleProfile();
  await fixSalesOrderPermission();
  await setupAgentFields();
  await setupAssignmentRules();
  await cleanupServerScripts();
  await setupOpportunityNotifications();
  await setupWebhooks();
  console.log("\n✅ Foundation setup complete.\n");
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });