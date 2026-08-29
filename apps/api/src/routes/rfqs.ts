import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function rfqRoutes(app: FastifyInstance) {
  app.get("/rfqs", async () => {
    return prisma.rfq.findMany({
      orderBy: { receivedAt: "desc" },
      include: { parsedSpec: true, quote: true },
    });
  });

  app.get("/rfqs/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: { parsedSpec: true, quote: true },
    });
    if (!rfq) return reply.code(404).send({ error: "not found" });
    return rfq;
  });
}
