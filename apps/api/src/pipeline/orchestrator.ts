import type { NormalizedMessage } from "../types.js";
import { normalizeAndCreateRfq } from "./normalize.js";
import { parseRfq } from "./parse.js";
import { matchCatalog } from "./catalogMatch.js";
import { findCustomerByContact, customerOrderHistoryForSku } from "./retrieval.js";
import { calculatePrice } from "./pricing.js";
import { assessConfidence } from "./confidence.js";
import { draftReply } from "./draft.js";
import { persistQuote } from "./persistQuote.js";

export async function processInboundRfq(msg: NormalizedMessage) {
  const rfq = await normalizeAndCreateRfq(msg);

  const parsed = await parseRfq(msg.rawText);
  const match = await matchCatalog(parsed.item_raw, parsed.spec);

  const customer = await findCustomerByContact(msg.senderId);
  const history = customer && match ? await customerOrderHistoryForSku(customer.id, match.sku) : [];
  const historicalAvgQty = history.length
    ? history.reduce((sum, o) => sum + o.quantity, 0) / history.length
    : null;

  const inStock = match ? match.stockQty > 0 : null;

  const confidence = assessConfidence({
    parsed,
    matched: !!match,
    inStock,
    quantity: parsed.quantity,
    historicalAvgQty,
  });

  // Nothing to price if the matched item isn't actually available - never quote a total on a sale that can't happen.
  const priceBreakdown = match && inStock && parsed.quantity ? calculatePrice(match.unitPrice, parsed.quantity) : null;

  const missingField = !parsed.quantity
    ? "quantity"
    : !parsed.spec && parsed.confidence_per_field.spec === "low"
      ? "spec"
      : null;

  const message = await draftReply({
    itemName: match?.name ?? null,
    quantity: parsed.quantity,
    unit: parsed.unit,
    inStock,
    priceBreakdown,
    missingField,
    mustEscalate: false,
  });

  const { rfq: updatedRfq, quote } = await persistQuote({
    rfqId: rfq.id,
    source: msg.source,
    rawText: msg.rawText,
    sender: msg.senderId,
    receivedAt: msg.receivedAt,
    parsed,
    match,
    priceBreakdown,
    confidence,
    message,
  });

  return { rfq: updatedRfq, quote, confidence };
}
