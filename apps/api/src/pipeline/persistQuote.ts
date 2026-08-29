import { prisma } from "../lib/prisma.js";
import type { CatalogMatch, ConfidenceResult, ParsedSpec, PriceBreakdown } from "../types.js";

export async function persistQuote(params: {
  /** Reuse and update the status of an already-created Rfq (webhook flow) instead of creating a new one. */
  rfqId?: string;
  conversationId?: string;
  source: string;
  rawText: string;
  sender: string;
  receivedAt: Date;
  parsed: ParsedSpec;
  match: CatalogMatch | null;
  priceBreakdown: PriceBreakdown | null;
  confidence: ConfidenceResult;
  message: string;
}) {
  const status = params.confidence.autoSend ? "auto_sent" : "pending_review";

  const rfq = params.rfqId
    ? await prisma.rfq.update({ where: { id: params.rfqId }, data: { status } })
    : await prisma.rfq.create({
        data: {
          conversationId: params.conversationId,
          source: params.source,
          rawText: params.rawText,
          sender: params.sender,
          receivedAt: params.receivedAt,
          status,
        },
      });

  await prisma.parsedSpec.create({
    data: {
      rfqId: rfq.id,
      itemRaw: params.parsed.item_raw,
      matchedSku: params.match?.sku ?? null,
      quantity: params.parsed.quantity,
      unit: params.parsed.unit,
      spec: params.parsed.spec,
      deadline: params.parsed.deadline ? new Date(params.parsed.deadline) : null,
      confidence: params.parsed.confidence_per_field,
    },
  });

  const quote = await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      priceBreakdown: params.priceBreakdown ? { ...params.priceBreakdown } : {},
      confidence: params.confidence.overall,
      warnings: params.confidence.reasons,
      message: params.message,
      status,
      sentAt: params.confidence.autoSend ? new Date() : null,
    },
  });

  return { rfq, quote };
}
