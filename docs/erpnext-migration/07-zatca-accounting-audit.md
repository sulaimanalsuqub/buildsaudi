# 07 — ZATCA / Accounting Audit (PHASE 7) — AUDIT ONLY

> Read-only. **No accounting/ZATCA change was made.** All configuration below is gated on explicit
> user approval (spec §36) and must run as a separate, deliberate phase after the operating cycle is
> signed off.

---

## Current state (as audited 2026-10-04)

| Area | State |
|---|---|
| ZATCA app | `ksa_compliance 0.61.4` installed; its 50 Custom Fields + Property Setters present (localization) |
| **ZATCA Business Settings** | **empty — ZATCA integration NOT onboarded** (no CSID / compliance setup) |
| Company VAT (`tax_id`) | **empty** (required for e-invoicing) |
| Sales/Purchase Taxes & Charges Templates | **0** (no VAT 15% template yet) |
| Item Tax Template / Tax Category | **0 / 0** |
| Chart of Accounts | `Standard with Numbers`, fully wired (COGS 5111, Sales 4110, Debtors 1310, Creditors 2110, Stock-in-hand 1410, SRBNB 2210 …) |
| Perpetual inventory | enabled |

## Gated configuration steps (DO NOT run without approval + real data)

1. **Company VAT** — set `tax_id` to Build/EFAD FOR MARKETING's 15-digit VAT number (from the user).
2. **VAT 15% tax setup** — create a Tax Category + Sales & Purchase *Taxes and Charges Templates*
   (Output/Input VAT 15%) mapped to the correct VAT accounts, + an Item Tax Template if needed.
   > **Finding (2026-10-04):** the CoA currently has only the **group** account `2300 - Duties and
   > Taxes`, with **no leaf VAT ledger account**. Taxes & Charges Templates require a *single* (leaf)
   > account, so this step first needs **Output VAT** + **Input VAT** leaf accounts created under the
   > CoA — an accounting-structure change explicitly gated by §36. An attempt to pre-create the
   > templates against the group account was correctly rejected by ERPNext and reverted; PHASE 7 is
   > left un-started. (Tax Category + Item Tax Template are harmless masters but were also reverted to
   > keep this phase clean until approval.)
3. **ZATCA Business Settings** (ksa_compliance) — onboard the entity: legal name, VAT, address,
   business transaction types; run **compliance (simulation) onboarding first**, then production
   CSID. This obtains a compliance CSID from ZATCA and is effectively irreversible — **requires
   explicit approval and ZATCA portal credentials/OTP.**
4. **Phased rollout** — Phase-1 (reporting/clearance in sandbox) → verify generated XML/QR on a few
   Draft/sandbox invoices → only then Phase-2 production.
5. **Legal identity on documents** — Letter Head / Print Formats show **EFAD FOR MARKETING** (legal
   entity) with CR + VAT; "Build" appears as the operating brand (see B2G print format, doc 10).

## Notes
- No Sales Invoice / Purchase Invoice was created or submitted on production during this migration
  (those post GL under perpetual inventory). Invoicing e2e belongs to this gated phase / a test site.
- Everything ZATCA-related stays native to `ksa_compliance`; no Build customization is added here.
