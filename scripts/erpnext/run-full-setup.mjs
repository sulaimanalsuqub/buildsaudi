/**
 * Master setup — runs all Build ERPNext configuration scripts in order.
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret \
 *   ERPNEXT_WEBHOOK_SECRET=... \
 *   ADMIN_EMAIL=... \
 *   node scripts/erpnext/run-full-setup.mjs
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const env = { ...process.env };

const scripts = [
  "setup-build-foundation.mjs",
  "setup-build-roles.mjs",
  "setup-build-workflow-permissions.mjs",
  "setup-build-operations-workspace.mjs",
  "setup-build-supplier-onboarding-automation.mjs",
  "setup-build-vendor-two-phase.mjs",
  "setup-build-rfq-automation.mjs",
  "setup-build-supplier-quotation-automation.mjs",
  "setup-build-customer-quotation-automation.mjs",
  "setup-build-order-automation.mjs",
  "setup-build-delivery-status-automation.mjs",
  "setup-build-agents-erp.mjs",
  "setup-build-quotation-send-gate.mjs",
];

console.log("\n══════════════════════════════════════════");
console.log("  Build.sa — Full ERPNext Setup");
console.log("══════════════════════════════════════════\n");

let passed = 0;
let failed = 0;

for (const script of scripts) {
  const path = join(__dir, script);
  console.log(`\n▶ ${script}`);
  console.log("─".repeat(50));
  try {
    execSync(`node "${path}"`, { stdio: "inherit", env, cwd: join(__dir, "../..") });
    passed++;
  } catch {
    console.error(`\n✗ FAILED: ${script}`);
    failed++;
  }
}

console.log("\n══════════════════════════════════════════");
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════════\n");

if (failed > 0) process.exit(1);