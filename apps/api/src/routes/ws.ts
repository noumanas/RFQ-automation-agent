import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { handleBuyerMessage } from "../pipeline/chat/respond.js";
import {
  subscribeConversation,
  subscribeStaff,
  broadcastToConversation,
  broadcastToStaff,
} from "../lib/hub.js";

const BuyerEventSchema = z.object({ type: z.literal("message"), text: z.string().min(1) });

const StaffEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("takeover"), conversationId: z.string(), staffName: z.string().min(1) }),
  z.object({ type: z.literal("release"), conversationId: z.string() }),
  z.object({
    type: z.literal("message"),
    conversationId: z.string(),
    text: z.string().min(1),
    staffName: z.string().min(1),
  }),
]);

function onMessage(socket: WebSocket, handler: (raw: string) => Promise<void>) {
  socket.on("message", (raw: Buffer) => {
    void handler(raw.toString()).catch((err) => {
      socket.send(JSON.stringify({ type: "error", message: (err as Error).message }));
    });
  });
}

export async function wsRoutes(app: FastifyInstance) {
  app.get("/ws/conversations/:id", { websocket: true }, (socket, req) => {
    const { id } = req.params as { id: string };
    subscribeConversation(id, socket);

    onMessage(socket, async (raw) => {
      const event = BuyerEventSchema.parse(JSON.parse(raw));
      await handleBuyerMessage(id, event.text);
    });
  });

  app.get("/ws/staff", { websocket: true }, (socket) => {
    subscribeStaff(socket);

    onMessage(socket, async (raw) => {
      const event = StaffEventSchema.parse(JSON.parse(raw));

      if (event.type === "takeover") {
        const conversation = await prisma.conversation.update({
          where: { id: event.conversationId },
          data: { status: "staff", staffName: event.staffName, needsAttention: false },
        });
        broadcastToConversation(event.conversationId, { type: "status_changed", status: "staff" });
        broadcastToStaff({
          type: "status_changed",
          conversationId: event.conversationId,
          status: "staff",
          staffName: conversation.staffName,
        });
      }

      if (event.type === "release") {
        await prisma.conversation.update({
          where: { id: event.conversationId },
          data: { status: "bot", staffName: null },
        });
        broadcastToConversation(event.conversationId, { type: "status_changed", status: "bot" });
        broadcastToStaff({ type: "status_changed", conversationId: event.conversationId, status: "bot" });
      }

      if (event.type === "message") {
        const message = await prisma.message.create({
          data: { conversationId: event.conversationId, sender: "staff", text: event.text },
        });
        broadcastToConversation(event.conversationId, { type: "message", message });
        broadcastToStaff({ type: "message", conversationId: event.conversationId, message });
      }
    });
  });
}
