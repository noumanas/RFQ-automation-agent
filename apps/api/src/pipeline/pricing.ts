import type { PriceBreakdown } from "../types.js";

const DISCOUNT_TIERS = [
  { minQty: 500, pct: 0.1 },
  { minQty: 100, pct: 0.05 },
  { minQty: 20, pct: 0.02 },
];
const HANDLING_FEE = 0;

export function calculatePrice(unitPrice: number, quantity: number): PriceBreakdown {
  const tier = DISCOUNT_TIERS.find((t) => quantity >= t.minQty);
  const discountPct = tier?.pct ?? 0;
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotal * discountPct;
  const total = subtotal - discountAmount + HANDLING_FEE;

  return { unitPrice, quantity, subtotal, discountPct, discountAmount, handlingFee: HANDLING_FEE, total };
}
