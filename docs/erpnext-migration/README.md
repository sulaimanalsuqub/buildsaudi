# Build → ERPNext Migration (Native-first)

Build (operating brand) on **ERPNext** at `buildsaudi.k.frappe.cloud`, legal entity
**EFAD FOR MARKETING**. Managed-procurement model (Build buys from suppliers, sells to customers —
not a marketplace). Native ERPNext first; minimum customization; nothing irreversible without approval.

## Index
| Doc | Contents |
|---|---|
| [00-current-state-audit](00-current-state-audit.md) | PHASE 0 audit: ERPNext + repo state, gaps |
| [01-native-capability-map](01-native-capability-map.md) | per-requirement native/config/custom decision |
| [02-target-architecture](02-target-architecture.md) | end-state flow + PHASE 1 masters created |
| [03-buildsaudi-integration](03-buildsaudi-integration.md) | `lib/erpnext.ts` client + seam cutover + PHASE 2 |
| [04-supplier-model](04-supplier-model.md) | Supplier lifecycle (tags+disabled) + capabilities (Party Specific Item) + PHASE 3 |
| [05-procurement-flow](05-procurement-flow.md) | RFQ → Supplier Quotation → comparison + PHASE 4 |
| [06-fulfillment-flow](06-fulfillment-flow.md) | Quotation→SO→PO (PHASE 5) + fulfilment routes (PHASE 6) |
| [07-testing](07-testing.md) | all automated + live tests |
| [07-zatca-accounting-audit](07-zatca-accounting-audit.md) | PHASE 7 ZATCA/accounting audit (gated) |
| [08-cutover](08-cutover.md) | feature switch, gates, rollback |
| [09-customization-register](09-customization-register.md) | every non-native change (minimal) |
| [10-b2g-government-quotation](10-b2g-government-quotation.md) | B2G government project quotation + print format |

## Status
| Phase | Status |
|---|---|
| 0 Audit | ✅ |
| 1 Masters + native config | ✅ (Item Group tree, 6 service items, consolidation WH, Workspace) |
| 2 `/get-quote` → ERPNext | ✅ app-side + live-verified |
| 3 `/register` → ERPNext | ✅ core app-side + live-verified (onboarding/files sub-flow = follow-up) |
| 4 RFQ → Draft Supplier Quotation | ✅ inbound + comparison; outbound send = follow-up |
| 5 Quotation → SO → PO | ✅ native, verified |
| 6 Fulfilment routes | ✅ native confirmed; stock e2e → test site (perpetual inventory) |
| 7 ZATCA/accounting | ⏸ audit done; config gated on approval |
| 8 B2G Government Quotation | ✅ 7 custom fields + print format, live-verified |

## ERPNext customizations
Migration (1–7): **zero**. B2G (8): **7 Custom Fields on Quotation + 1 Print Format** (+ 2 master rows),
all upgrade-safe and removable — see [09](09-customization-register.md).

## Rollback
Unset `ERPNEXT_BASE_URL` in an environment → that environment reverts to Odoo/Build-OPT instantly.
