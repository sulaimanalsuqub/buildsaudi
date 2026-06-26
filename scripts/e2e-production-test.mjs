/**
 * End-to-end production smoke test for Build.sa vendor + quote flows.
 *
 * Run: node scripts/e2e-production-test.mjs
 */

import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const BASE = process.env.E2E_BASE_URL || "https://www.build.sa";
const ERPNEXT = (env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const stamp = Date.now();
const email = `e2e-${stamp}@build.sa.test`;
const cr = String(3000000000 + (stamp % 699999999));
const establishment = `مورد E2E ${stamp}`;
const manager = "اختبار نظام";
const phone = `+96655100${String(stamp).slice(-5)}`;

const results = [];
const pass = (s, d) => {
  results.push({ ok: true, s, d });
  console.log(`  ✅ ${s}: ${d}`);
};
const fail = (s, d) => {
  results.push({ ok: false, s, d });
  console.log(`  ❌ ${s}: ${d}`);
};

function getSecret() {
  return env.OTP_SECRET || env.ERPNEXT_WEBHOOK_SECRET || "build-otp-dev-only";
}

function generateVerifiedToken(addr) {
  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", getSecret())
    .update(`verified:${addr.toLowerCase().trim()}:${ts}`)
    .digest("hex")
    .slice(0, 16);
  return `${ts}.${sig}`;
}

function generateVendorOnboardingToken(supplierName, addr) {
  const exp = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;
  const sig = createHmac("sha256", getSecret())
    .update(`vendor-onboard:${supplierName}:${addr.toLowerCase().trim()}:${exp}`)
    .digest("hex")
    .slice(0, 24);
  return `${encodeURIComponent(supplierName)}.${exp}.${sig}`;
}

async function api(url, opts = {}) {
  const r = await fetch(url, opts);
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = { raw: t.slice(0, 200) };
  }
  return { status: r.status, body: j };
}

async function erp(method, path, body) {
  const r = await fetch(`${ERPNEXT}${path}`, {
    method,
    headers: {
      Authorization: `token ${env.ERPNEXT_API_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = { raw: t };
  }
  if (!r.ok) {
    throw new Error(`${method} ${path} → ${r.status}: ${(j.exception || j.message || t).slice(0, 300)}`);
  }
  return j.data ?? j.message ?? j;
}

async function applyWorkflow(name, action) {
  const doc = await erp("GET", `/api/resource/Supplier/${encodeURIComponent(name)}`);
  const updated = await erp("POST", "/api/method/frappe.model.workflow.apply_workflow", { doc, action });
  const today = new Date().toISOString().slice(0, 10);
  const base = { build_review_date: today, build_reviewed_by: "partner@build.sa" };
  let updates = {};
  if (action === "Approve") {
    updates = {
      ...base,
      supplier_group: "Build Pre-Registered Suppliers",
      build_verification_status: "Invited",
      build_preferred_for_rfq: 0,
      build_rfq_priority: "Standard",
    };
  } else if (action === "Review") {
    updates = { ...base, build_verification_status: "Pending" };
  }
  if (Object.keys(updates).length) {
    await erp("PUT", `/api/resource/Supplier/${encodeURIComponent(name)}`, updates);
    return erp("GET", `/api/resource/Supplier/${encodeURIComponent(name)}`);
  }
  return updated;
}

async function main() {
  console.log(`\nBuild.sa E2E — ${BASE}\n`);

  const health = await api(`${BASE}/api/health`);
  if (health.status === 200 && health.body.ok && health.body.erpnext_reachable) {
    pass("Health check", "ERPNext reachable");
  } else {
    fail("Health check", JSON.stringify(health.body));
    return summarize();
  }

  let supplierId = null;

  try {
    const token = generateVerifiedToken(email);
    const reg = await api(`${BASE}/api/vendors/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        establishment_name: establishment,
        manager_name: manager,
        contact_number: phone,
        email,
        email_verified_token: token,
        cr_number: cr,
      }),
    });
    if (reg.status === 200 && reg.body.ok && reg.body.id) {
      supplierId = reg.body.id;
      pass("Production register API", supplierId);
    } else {
      fail("Production register API", `${reg.status} ${JSON.stringify(reg.body)}`);
      return summarize();
    }
  } catch (e) {
    fail("Production register API", e.message);
    return summarize();
  }

  try {
    const s = await erp("GET", `/api/resource/Supplier/${encodeURIComponent(supplierId)}`);
    if (s.build_supplier_stage === "Pre Registration" && s.build_cr_number === cr) {
      pass("ERPNext supplier created", s.build_supplier_stage);
    } else {
      fail("ERPNext supplier created", JSON.stringify({ stage: s.build_supplier_stage, cr: s.build_cr_number }));
    }
  } catch (e) {
    fail("ERPNext supplier created", e.message);
  }

  try {
    await applyWorkflow(supplierId, "Review");
    const approved = await applyWorkflow(supplierId, "Approve");
    if (approved.build_supplier_stage === "Approved" && approved.build_verification_status === "Invited") {
      pass("First approval (invite only)", approved.build_verification_status);
    } else {
      fail("First approval", JSON.stringify(approved));
    }
  } catch (e) {
    fail("Workflow approval", e.message);
  }

  const onboardToken = generateVendorOnboardingToken(supplierId, email);

  try {
    const onb = await api(`${BASE}/api/vendors/onboarding?token=${encodeURIComponent(onboardToken)}`);
    if (onb.status === 200 && onb.body.ok) {
      pass("Onboarding token API", onb.body.establishment_name);
    } else {
      fail("Onboarding token API", `${onb.status} ${JSON.stringify(onb.body)}`);
    }
  } catch (e) {
    fail("Onboarding token API", e.message);
  }

  try {
    const emailToken = generateVerifiedToken(email);
    const complete = await api(`${BASE}/api/vendors/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding_token: onboardToken,
        email_verified_token: emailToken,
        vendor_type: "موزع",
        product_categories: ["حديد"],
        coverage_regions: ["الرياض"],
        has_warehouse: true,
        offers_credit: false,
        payment_terms: ["نقد"],
        worked_on_gov_projects: false,
        bank_name: "البنك الأهلي",
        iban: "SA0380000000608010167519",
        iban_account_name: establishment,
        cr_name_on_document: establishment,
        tax_number: "300000000000003",
        national_address: "RRRD2929",
      }),
    });
    if (complete.status === 200 && complete.body.ok) {
      pass("Complete profile API", complete.body.id);
    } else {
      fail("Complete profile API", `${complete.status} ${JSON.stringify(complete.body)}`);
    }
  } catch (e) {
    fail("Complete profile API", e.message);
  }

  try {
    const s = await erp("GET", `/api/resource/Supplier/${encodeURIComponent(supplierId)}`);
    if (
      s.build_profile_completed === 1 &&
      (s.build_supplier_stage === "Under Review" || s.build_verification_status === "Profile Submitted")
    ) {
      pass("Profile submitted state", `${s.build_supplier_stage} / ${s.build_verification_status}`);
    } else {
      fail(
        "Profile submitted state",
        JSON.stringify({
          stage: s.build_supplier_stage,
          completed: s.build_profile_completed,
          verification: s.build_verification_status,
        })
      );
    }
  } catch (e) {
    fail("Profile submitted state", e.message);
  }

  try {
    const quote = await api(`${BASE}/api/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: "مشروع اختبار E2E",
        client_name: "عميل اختبار",
        phone: "+966551234567",
        materials: "حديد 10 طن، أسمنت 50 كيس",
        delivery_address: "الرياض — حي النرجس",
        delivery_date: "2026-07-15",
      }),
    });
    if (quote.status === 200 || quote.status === 201) {
      pass("Quote request API", String(quote.status));
    } else {
      fail("Quote request API", `${quote.status} ${JSON.stringify(quote.body)}`);
    }
  } catch (e) {
    fail("Quote request API", e.message);
  }

  try {
    await erp("DELETE", `/api/resource/Supplier/${encodeURIComponent(supplierId)}`);
    pass("Cleanup test supplier", supplierId);
  } catch (e) {
    fail("Cleanup test supplier", e.message);
  }

  summarize();
}

function summarize() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n── E2E Summary: ${passed} passed, ${failed} failed ──\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});