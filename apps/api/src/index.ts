import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import staticPlugin from "@fastify/static";
import websocketPlugin from "@fastify/websocket";
import { env } from "./env.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { rfqRoutes } from "./routes/rfqs.js";
import { reviewRoutes } from "./routes/review.js";
import { conversationRoutes } from "./routes/conversations.js";
import { wsRoutes } from "./routes/ws.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(websocketPlugin);
await app.register(staticPlugin, {
  root: fileURLToPath(new URL("../public", import.meta.url)),
});

app.get("/health", async () => ({ ok: true }));

await app.register(webhookRoutes);
await app.register(rfqRoutes);
await app.register(reviewRoutes);
await app.register(conversationRoutes);
await app.register(wsRoutes);

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
