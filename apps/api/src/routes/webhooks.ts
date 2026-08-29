import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { processInboundRfq } from "../pipeline/orchestrator.js";

const WhatsAppWebhookSchema = z.object({
  from: z.string(),
  text: z.string(),
  attachments: z.array(z.string()).default([]),
});

const EmailWebhookSchema = z.object({
  from: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  attachments: z.array(z.string()).default([]),
});

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/webhooks/whatsapp", async (req, reply) => {
    const body = WhatsAppWebhookSchema.parse(req.body);
    const result = await processInboundRfq({
      source: "whatsapp",
      rawText: body.text,
      attachments: body.attachments,
      senderId: body.from,
      receivedAt: new Date(),
    });
    return reply.code(201).send(result);
  });

  app.post("/webhooks/email", async (req, reply) => {
    const body = EmailWebhookSchema.parse(req.body);
    const rawText = body.subject ? `${body.subject}\n\n${body.body}` : body.body;
    const result = await processInboundRfq({
      source: "email",
      rawText,
      attachments: body.attachments,
      senderId: body.from,
      receivedAt: new Date(),
    });
    return reply.code(201).send(result);
  });
}
