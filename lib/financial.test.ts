import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCustomerPricing } from "./financial.ts";

test("VAT-inclusive supplier total is normalized before markup and output VAT", () => {
  const result = normalizeCustomerPricing({ supplierGrossSar: 1150, taxState: "included", deliveryState: "included", externalFreightSar: null, vatRatePct: 15, markupPct: 10 });
  assert.deepEqual(result, { materialsNetSar: 1000, supplierInputVatSar: 150, supplierGrossSar: 1150, externalFreightSar: 0, procurementCostSar: 1000, markupSar: 100, customerTaxableBaseSar: 1100, outputVatSar: 165, customerGrossSar: 1265 });
});

test("delivery excluded requires explicit freight and does not double count it", () => {
  const result = normalizeCustomerPricing({ supplierGrossSar: 1000, taxState: "excluded", deliveryState: "excluded", externalFreightSar: 100, vatRatePct: 15, markupPct: 10 });
  assert.equal(result.procurementCostSar, 1100);
  assert.equal(result.customerGrossSar, 1391.5);
  assert.throws(() => normalizeCustomerPricing({ supplierGrossSar: 1000, taxState: "excluded", deliveryState: "included", externalFreightSar: 100, vatRatePct: 15, markupPct: 10 }));
});

test("unknown supplier inclusion states block automatic pricing", () => {
  assert.throws(() => normalizeCustomerPricing({ supplierGrossSar: 1000, taxState: "unknown", deliveryState: "included", externalFreightSar: null, vatRatePct: 15, markupPct: 10 }));
  assert.throws(() => normalizeCustomerPricing({ supplierGrossSar: 1000, taxState: "excluded", deliveryState: "unknown", externalFreightSar: null, vatRatePct: 15, markupPct: 10 }));
});

test("all tax/delivery combinations either normalize or fail closed", () => {
  const base = { supplierGrossSar: 1150, vatRatePct: 15, markupPct: 10 };
  assert.equal(normalizeCustomerPricing({ ...base, taxState: "included", deliveryState: "included", externalFreightSar: null }).customerGrossSar, 1265);
  assert.equal(normalizeCustomerPricing({ ...base, taxState: "included", deliveryState: "excluded", externalFreightSar: 100 }).customerGrossSar, 1391.5);
  assert.equal(normalizeCustomerPricing({ ...base, taxState: "excluded", deliveryState: "included", externalFreightSar: null }).customerGrossSar, 1454.75);
  assert.equal(normalizeCustomerPricing({ ...base, taxState: "excluded", deliveryState: "excluded", externalFreightSar: 100 }).customerGrossSar, 1581.25);
  assert.throws(() => normalizeCustomerPricing({ ...base, taxState: "included", deliveryState: "included", externalFreightSar: 1 }));
  assert.throws(() => normalizeCustomerPricing({ ...base, taxState: "excluded", deliveryState: "excluded", externalFreightSar: null }));
});
