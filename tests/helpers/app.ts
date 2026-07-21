import Fastify, { type FastifyInstance } from "fastify";
import { registerSyncRoutes } from "../../src/api/sync/route.js";

export async function buildSyncTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(registerSyncRoutes);
  await app.ready();
  return app;
}
