export type InclusionState = "included" | "excluded" | "unknown";

export type NormalizedCostInput = {
  supplierGrossSar: number;
  taxState: InclusionState;
  deliveryState: InclusionState;
  externalFreightSar: number | null;
  vatRatePct: number;
  markupPct: number;
};

export type NormalizedCost = {
  materialsNetSar: number;
  supplierInputVatSar: number;
  supplierGrossSar: number;
  externalFreightSar: number;
  procurementCostSar: number;
  markupSar: number;
  customerTaxableBaseSar: number;
  outputVatSar: number;
  customerGrossSar: number;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Normalizes a supplier total before pricing.  This deliberately refuses unknown
 * inclusion states: an automatic customer quote must never infer tax/delivery.
 */
export function normalizeCustomerPricing(input: NormalizedCostInput): NormalizedCost {
  if (!Number.isFinite(input.supplierGrossSar) || input.supplierGrossSar < 0) throw new Error("Invalid supplier gross total");
  if (!Number.isFinite(input.vatRatePct) || input.vatRatePct < 0) throw new Error("Invalid VAT rate");
  if (!Number.isFinite(input.markupPct) || input.markupPct < 0) throw new Error("Invalid markup");
  if (input.taxState === "unknown") throw new Error("Supplier tax inclusion is unknown");
  if (input.deliveryState === "unknown") throw new Error("Supplier delivery inclusion is unknown");
  if (input.deliveryState === "included" && input.externalFreightSar !== null) {
    throw new Error("External freight cannot be added when supplier delivery is included");
  }
  if (input.deliveryState === "excluded" && input.externalFreightSar === null) {
    throw new Error("External freight is required when supplier delivery is excluded");
  }
  const vatMultiplier = 1 + input.vatRatePct / 100;
  const materialsNetSar = input.taxState === "included" ? round2(input.supplierGrossSar / vatMultiplier) : round2(input.supplierGrossSar);
  const supplierInputVatSar = input.taxState === "included" ? round2(input.supplierGrossSar - materialsNetSar) : 0;
  const freight = round2(input.externalFreightSar ?? 0);
  const procurementCostSar = round2(materialsNetSar + freight);
  const markupSar = round2(procurementCostSar * (input.markupPct / 100));
  const customerTaxableBaseSar = round2(procurementCostSar + markupSar);
  const outputVatSar = round2(customerTaxableBaseSar * (input.vatRatePct / 100));
  return {
    materialsNetSar,
    supplierInputVatSar,
    supplierGrossSar: round2(input.supplierGrossSar),
    externalFreightSar: freight,
    procurementCostSar,
    markupSar,
    customerTaxableBaseSar,
    outputVatSar,
    customerGrossSar: round2(customerTaxableBaseSar + outputVatSar),
  };
}
