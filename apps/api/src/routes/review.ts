import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const EditSchema = z.object({
  message: z.string().optional(),
  priceBreakdown: z.record(z.any()).optional(),
});
const ActionSchema = z.object({ reviewedBy: z.string() });

export async function reviewRoutes(app: FastifyInstance) {
  app.get("/review-queue", async () => {
    return prisma.quote.findMany({
      where: { status: { in: ["pending_review", "auto_sent"] } },
      orderBy: { createdAt: "asc" },
      include: { rfq: { include: { parsedSpec: true } } },
    });
  });

  app.patch("/review-queue/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = EditSchema.parse(req.body);
    return prisma.quote.update({ where: { id }, data: body });
  });

  app.post("/review-queue/:id/approve", async (req) => {
    const { id } = req.params as { id: string };
    const { reviewedBy } = ActionSchema.parse(req.body);
    return prisma.quote.update({
      where: { id },
      data: { status: "approved_sent", sentAt: new Date(), reviewedBy },
    });
  });

  app.post("/review-queue/:id/reject", async (req) => {
    const { id } = req.params as { id: string };
    const { reviewedBy } = ActionSchema.parse(req.body);
    return prisma.quote.update({
      where: { id },
      data: { status: "rejected", reviewedBy },
    });
  });
}
