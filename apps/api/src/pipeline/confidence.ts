import type { ConfidenceResult, ParsedSpec } from "../types.js";

const QUANTITY_ANOMALY_MULTIPLIER = 3;

export function assessConfidence(params: {
  parsed: ParsedSpec;
  matched: boolean;
  inStock: boolean | null;
  quantity: number | null;
  historicalAvgQty: number | null;
}): ConfidenceResult {
  const { parsed, matched, inStock, quantity, historicalAvgQty } = params;
  const reasons: string[] = [];

  if (!matched) reasons.push("Unmatched item - no confident catalog match");
  if (parsed.confidence_per_field.item !== "high") reasons.push("Item description confidence is not high");
  if (matched && inStock === false) reasons.push("Item is out of stock - needs a restock/alternative call, not an auto-quote");

  if (quantity == null) reasons.push("Quantity not specified");
  else if (parsed.confidence_per_field.quantity !== "high") reasons.push("Quantity confidence is not high");

  if (parsed.spec == null && parsed.confidence_per_field.spec === "low") {
    reasons.push("Spec/size not specified");
  }

  if (historicalAvgQty && quantity && quantity >= historicalAvgQty * QUANTITY_ANOMALY_MULTIPLIER) {
    reasons.push(`Quantity ${quantity} is ${QUANTITY_ANOMALY_MULTIPLIER}x+ this customer's usual order`);
  }

  const autoSend = reasons.length === 0;
  const overall = autoSend ? "high" : reasons.length <= 1 ? "medium" : "low";

  return { autoSend, overall, reasons };
}
