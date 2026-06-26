/**
 * Grant Build Manager and Build Operations roles access to workflow actions.
 * ERPNext allows one role per transition row — duplicate transitions as needed.
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-workflow-permissions.mjs
 */

const BASE_URL = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const API_TOKEN = process.env.ERPNEXT_API_TOKEN;

if (!API_TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const headers = {
  Authorization: `token ${API_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const BUILD_ROLES = ["Build Manager", "Build Operations", "Build Team", "System Manager"];

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
    throw new Error(`${method} ${path} → ${res.status}: ${data?.exception || data?.message || text}`);
  }
  return data?.data ?? data?.message ?? data;
}

function expandTransitions(transitions) {
  const key = (t) => `${t.state}::${t.action}::${t.next_state}`;
  const byKey = new Map();

  for (const t of transitions) {
    const roles = new Set([t.allowed, ...BUILD_ROLES].filter(Boolean));
    byKey.set(key(t), {
      state: t.state,
      action: t.action,
      next_state: t.next_state,
      allow_self_approval: 1,
      send_email_to_creator: t.send_email_to_creator ?? 0,
      roles,
    });
  }

  const expanded = [];
  let idx = 1;
  for (const entry of byKey.values()) {
    for (const role of entry.roles) {
      expanded.push({
        idx: idx++,
        state: entry.state,
        action: entry.action,
        next_state: entry.next_state,
        allowed: role,
        allow_self_approval: entry.allow_self_approval,
        send_email_to_creator: entry.send_email_to_creator,
      });
    }
  }
  return expanded;
}

async function updateWorkflow(name) {
  const workflow = await api("GET", `/api/resource/Workflow/${encodeURIComponent(name)}`);
  const transitions = expandTransitions(workflow.transitions || []);

  await api("PUT", `/api/resource/Workflow/${encodeURIComponent(name)}`, {
    transitions,
  });

  console.log(`  ✓ ${name} (${transitions.length} transition rows)`);
}

async function main() {
  console.log(`\nBuild Workflow Permissions — ${BASE_URL}\n`);
  await updateWorkflow("Build Product Request Workflow");
  await updateWorkflow("Build Supplier Onboarding");
  console.log("\n✅ Workflow permissions updated.\n");
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});