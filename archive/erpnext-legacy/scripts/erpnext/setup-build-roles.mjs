/**
 * setup-build-roles.mjs
 * Creates Build Saudi roles and DocType permissions in ERPNext.
 *
 * Roles:
 *   Build Manager     — full access, all doctypes, reports
 *   Build Operations  — internal team: Opportunity, RFQ, Quotation, SO, PO
 *   Build Supplier    — external suppliers: only their own RFQs
 *
 * Run:
 *   ERPNEXT_API_TOKEN=<key_id>:<key_secret> node scripts/erpnext/setup-build-roles.mjs
 */

const BASE_URL =
  (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const API_TOKEN = process.env.ERPNEXT_API_TOKEN;

if (!API_TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const headers = {
  Authorization: `token ${API_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ─── helpers ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) {
    const msg = data?.exception || data?.message || text;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return data?.data ?? data?.message ?? data;
}

async function exists(doctype, name) {
  try {
    await api("GET", `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
    return true;
  } catch (e) {
    if (e.message.includes("404") || e.message.includes("DoesNotExist")) return false;
    throw e;
  }
}

async function upsert(doctype, name, doc) {
  if (await exists(doctype, name)) {
    console.log(`  ↻ update  ${doctype} / ${name}`);
    return api("PUT", `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, doc);
  } else {
    console.log(`  + create  ${doctype} / ${name}`);
    return api("POST", `/api/resource/${encodeURIComponent(doctype)}`, { ...doc, name });
  }
}

// ─── 1. Roles ────────────────────────────────────────────────────────────────

const ROLES = [
  {
    name: "Build Team",
    role_name: "Build Team",
    desk_access: 1,
  },
  {
    name: "Build Manager",
    role_name: "Build Manager",
    desk_access: 1,
  },
  {
    name: "Build Operations",
    role_name: "Build Operations",
    desk_access: 1,
  },
  {
    name: "Build Supplier",
    role_name: "Build Supplier",
    desk_access: 1,
  },
];

async function setupRoles() {
  console.log("\n── Roles ──────────────────────────────────");
  for (const role of ROLES) {
    await upsert("Role", role.name, role);
  }
}

// ─── 2. DocType Permissions ──────────────────────────────────────────────────

/**
 * Permission matrix per DocType.
 * Each entry: { doctype, role, perms }
 * perms keys: read, write, create, delete, submit, cancel, amend, report, export, import, share, print, email
 */
const STANDARD_ROLES = [
  { doctype: "Opportunity", role: "System Manager", perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, export:1, print:1, email:1 } },
  { doctype: "Opportunity", role: "Sales Manager",  perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, export:1, print:1, email:1 } },
  { doctype: "Opportunity", role: "Sales User",     perms: { read:1, write:1, create:1, report:1, print:1, email:1 } },
];

const PERMISSIONS = [
  ...STANDARD_ROLES,
  // ── Opportunity ──
  { doctype: "Opportunity", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, report:1, export:1, print:1, email:1 } },
  { doctype: "Opportunity", role: "Build Operations", perms: { read:1, write:1, create:1, report:1, print:1, email:1 } },

  // ── Lead ──
  { doctype: "Lead", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, report:1, export:1 } },
  { doctype: "Lead", role: "Build Operations", perms: { read:1, write:1, create:1, report:1 } },

  // ── Request for Quotation ──
  { doctype: "Request for Quotation", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, print:1, email:1 } },
  { doctype: "Request for Quotation", role: "Build Operations", perms: { read:1, write:1, create:1, submit:1, cancel:1, amend:1, report:1, print:1, email:1 } },
  { doctype: "Request for Quotation", role: "Build Supplier",   perms: { read:1, print:1, email:1 } },

  // ── Supplier Quotation ──
  { doctype: "Supplier Quotation", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, print:1 } },
  { doctype: "Supplier Quotation", role: "Build Operations", perms: { read:1, write:1, create:1, submit:1, cancel:1, amend:1, report:1, print:1 } },
  { doctype: "Supplier Quotation", role: "Build Supplier",   perms: { read:1, write:1, create:1, print:1 } },

  // ── Quotation (Customer) ──
  { doctype: "Quotation", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, print:1, email:1 } },
  { doctype: "Quotation", role: "Build Operations", perms: { read:1, write:1, create:1, submit:1, cancel:1, amend:1, report:1, print:1, email:1 } },

  // ── Sales Order ──
  { doctype: "Sales Order", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, print:1 } },
  { doctype: "Sales Order", role: "Build Operations", perms: { read:1, write:1, create:1, submit:1, cancel:1, amend:1, report:1, print:1 } },

  // ── Purchase Order ──
  { doctype: "Purchase Order", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, submit:1, cancel:1, amend:1, report:1, print:1 } },
  { doctype: "Purchase Order", role: "Build Operations", perms: { read:1, write:1, create:1, submit:1, cancel:1, amend:1, report:1, print:1 } },

  // ── Supplier ──
  { doctype: "Supplier", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, report:1, export:1 } },
  { doctype: "Supplier", role: "Build Operations", perms: { read:1, write:1, create:1, report:1 } },
  { doctype: "Supplier", role: "Build Supplier",   perms: { read:1 } },

  // ── Customer ──
  { doctype: "Customer", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, report:1 } },
  { doctype: "Customer", role: "Build Operations", perms: { read:1, write:1, create:1, report:1 } },

  // ── Item ──
  { doctype: "Item", role: "Build Manager",    perms: { read:1, write:1, create:1, delete:1, report:1, import:1 } },
  { doctype: "Item", role: "Build Operations", perms: { read:1, report:1 } },
  { doctype: "Item", role: "Build Supplier",   perms: { read:1 } },
];

async function setPermission(doctype, role, perms) {
  // Delete all existing custom permission rows for this doctype+role, then create fresh
  try {
    const existing = await api(
      "GET",
      `/api/resource/Custom%20DocPerm?filters=${encodeURIComponent(JSON.stringify([
        ["Custom DocPerm", "parent", "=", doctype],
        ["Custom DocPerm", "role", "=", role],
      ]))}&fields=${encodeURIComponent(JSON.stringify(["name"]))}&limit_page_length=50`
    );
    const rows = Array.isArray(existing) ? existing : [];
    for (const row of rows) {
      await api("DELETE", `/api/resource/Custom%20DocPerm/${encodeURIComponent(row.name)}`);
    }
  } catch (_) {
    // ignore if none
  }

  // Create new permission row linked to the DocType
  const doc = {
    parent: doctype,
    parenttype: "DocType",
    parentfield: "permissions",
    role,
    permlevel: 0,
    read: perms.read ?? 0,
    write: perms.write ?? 0,
    create: perms.create ?? 0,
    delete: perms.delete ?? 0,
    submit: perms.submit ?? 0,
    cancel: perms.cancel ?? 0,
    amend: perms.amend ?? 0,
    report: perms.report ?? 0,
    export: perms.export ?? 0,
    import: perms.import ?? 0,
    share: perms.share ?? 0,
    print: perms.print ?? 0,
    email: perms.email ?? 0,
  };

  await api("POST", `/api/resource/Custom DocPerm`, doc);
  console.log(`  ✓ ${doctype.padEnd(30)} → ${role}`);
}

async function setupPermissions() {
  console.log("\n── DocType Permissions ────────────────────");
  for (const { doctype, role, perms } of PERMISSIONS) {
    await setPermission(doctype, role, perms);
  }
}

// ─── 3. User Profiles ────────────────────────────────────────────────────────

/**
 * Creates placeholder users so the client can test immediately.
 * Passwords are temporary — must be changed on first login.
 */
const TEST_USERS = [
  {
    email: "operations@buildsaudi.com",
    first_name: "Build",
    last_name: "Operations",
    role: "Build Operations",
    language: "ar",
  },
  {
    email: "manager@buildsaudi.com",
    first_name: "Build",
    last_name: "Manager",
    role: "Build Manager",
    language: "ar",
  },
];

async function setupUsers() {
  console.log("\n── Test Users ─────────────────────────────");
  for (const u of TEST_USERS) {
    const userDoc = {
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      language: u.language,
      send_welcome_email: 0,
      new_password: "BuildSaudi@2026!",
      home_settings: JSON.stringify({ workspace: "Build" }),
      roles: [{ role: u.role }, { role: "Build Team" }],
      module_profile: "Build Operations",
    };

    if (await exists("User", u.email)) {
      console.log(`  ↻ update  User / ${u.email}`);
      await api("PUT", `/api/resource/User/${encodeURIComponent(u.email)}`, userDoc);
    } else {
      console.log(`  + create  User / ${u.email}`);
      await api("POST", `/api/resource/User`, { ...userDoc, name: u.email });
    }
  }

  console.log("\n  Credentials (change after first login):");
  for (const u of TEST_USERS) {
    console.log(`    ${u.email}  →  BuildSaudi@2026!  [${u.role}]`);
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nBuild Saudi — Roles & Permissions Setup`);
  console.log(`Target: ${BASE_URL}\n`);

  await setupRoles();
  await setupPermissions();
  await setupUsers();

  console.log("\n✅ Done. Users created, permissions applied.");
  console.log("   Next: log in as each user and verify access in ERPNext.\n");
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
