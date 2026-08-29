import { prisma } from "../../lib/prisma.js";
import { broadcastToConversation, broadcastToStaff } from "../../lib/hub.js";
import { parseRfq } from "../parse.js";
import { matchCatalog } from "../catalogMatch.js";
import { calculatePrice } from "../pricing.js";
import { assessConfidence } from "../confidence.js";
import { draftReply } from "../draft.js";
import { persistQuote } from "../persistQuote.js";

const MAX_CLARIFYING_TURNS = 2;
const STAFF_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * A buyer with no phone/email on file yet is always treated as a new customer -
 * per the PRD, never assume order history when identity is uncertain.
 */
export async function handleBuyerMessage(conversationId: string, text: string) {
  const buyerMessage = await prisma.message.create({
    data: { conversationId, sender: "buyer", text },
  });

  broadcastToConversation(conversationId, { type: "message", message: buyerMessage });
  broadcastToStaff({ type: "message", conversationId, message: buyerMessage });

  let conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (conversation.status === "staff") {
    const lastStaffMessage = [...conversation.messages].reverse().find((m) => m.sender === "staff");
    const staffLastActiveAt = lastStaffMessage?.createdAt ?? conversation.updatedAt;
    const idleMs = Date.now() - staffLastActiveAt.getTime();

    if (idleMs < STAFF_IDLE_TIMEOUT_MS) return;

    // Staff took over but went quiet - don't leave the buyer stranded forever.
    conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "bot", staffName: null },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    broadcastToConversation(conversationId, { type: "status_changed", status: "bot" });
    broadcastToStaff({ type: "status_changed", conversationId, status: "bot" });
  }

  const transcript = conversation.messages.map((m) => `${m.sender}: ${m.text}`).join("\n");
  const parsed = await parseRfq(transcript);
  const match = await matchCatalog(parsed.item_raw, parsed.spec);
  const inStock = match ? match.stockQty > 0 : null;

  const confidence = assessConfidence({
    parsed,
    matched: !!match,
    inStock,
    quantity: parsed.quantity,
    historicalAvgQty: null,
  });

  // Nothing to price if the matched item isn't actually available - never quote a total on a sale that can't happen.
  const priceBreakdown = match && inStock && parsed.quantity ? calculatePrice(match.unitPrice, parsed.quantity) : null;
  const buyerTurns = conversation.messages.filter((m) => m.sender === "buyer").length;
  const mustEscalate = !confidence.autoSend && buyerTurns > MAX_CLARIFYING_TURNS;

  const missingField = !match
    ? "item"
    : !parsed.quantity
      ? "quantity"
      : !parsed.spec && parsed.confidence_per_field.spec === "low"
        ? "spec"
        : null;

  const replyText = await draftReply({
    itemName: match?.name ?? null,
    quantity: parsed.quantity,
    unit: parsed.unit,
    inStock,
    priceBreakdown,
    missingField,
    mustEscalate,
  });

  // A human may have taken over while the parse/draft calls above were in flight -
  // don't let a stale bot reply land after staff has already answered.
  const stillBotOwned = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
  if (stillBotOwned.status !== "bot") return;

  // Only a resolved, priced quote gets a structured card - clarifying questions
  // and staff hand-offs stay plain text.
  const quoteMeta = confidence.autoSend
    ? {
        type: "quote" as const,
        item: match?.name ?? parsed.item_raw,
        sku: match?.sku ?? null,
        quantity: parsed.quantity,
        unit: parsed.unit,
        spec: parsed.spec,
        inStock,
        priceBreakdown: priceBreakdown ? { ...priceBreakdown } : null,
      }
    : null;

  const botMessage = await prisma.message.create({
    data: { conversationId, sender: "bot", text: replyText, meta: quoteMeta ?? undefined },
  });
  broadcastToConversation(conversationId, { type: "message", message: botMessage });
  broadcastToStaff({ type: "message", conversationId, message: botMessage });

  if (confidence.autoSend || mustEscalate) {
    await persistQuote({
      conversationId,
      source: "widget",
      rawText: transcript,
      sender: conversation.visitorId,
      receivedAt: buyerMessage.createdAt,
      parsed,
      match,
      priceBreakdown,
      confidence,
      message: replyText,
    });
  }

  if (mustEscalate) {
    await prisma.conversation.update({ where: { id: conversationId }, data: { needsAttention: true } });
    broadcastToStaff({ type: "needs_attention", conversationId, needsAttention: true });
  }
}
