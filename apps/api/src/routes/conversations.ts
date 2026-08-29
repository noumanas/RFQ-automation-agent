import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { broadcastToStaff } from "../lib/hub.js";

const CreateConversationSchema = z.object({ visitorId: z.string().min(1) });

export async function conversationRoutes(app: FastifyInstance) {
  app.post("/conversations", async (req) => {
    const { visitorId } = CreateConversationSchema.parse(req.body);

    const existing = await prisma.conversation.findFirst({
      where: { visitorId, status: { not: "closed" } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;

    const conversation = await prisma.conversation.create({ data: { channel: "widget", visitorId } });
    broadcastToStaff({ type: "conversation_created", conversation: { ...conversation, messages: [] } });
    return conversation;
  });

  app.get("/conversations", async () => {
    const conversations = await prisma.conversation.findMany({
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    return conversations.sort((a, b) => {
      const aLast = (a.messages[0]?.createdAt ?? a.createdAt).getTime();
      const bLast = (b.messages[0]?.createdAt ?? b.createdAt).getTime();
      return bLast - aLast;
    });
  });

  app.get("/conversations/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) return reply.code(404).send({ error: "not found" });
    return conversation;
  });
}
