import { prisma } from "../lib/prisma.js";
import type { NormalizedMessage } from "../types.js";

export async function normalizeAndCreateRfq(msg: NormalizedMessage) {
  return prisma.rfq.create({
    data: {
      source: msg.source,
      rawText: msg.rawText,
      sender: msg.senderId,
      attachments: msg.attachments,
      receivedAt: msg.receivedAt,
      status: "pending",
    },
  });
}
