import Fastify, { type FastifyInstance } from "fastify";
import { registerWidgetRoutes } from "../../src/api/widget/index.js";

export async function buildWidgetTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(registerWidgetRoutes);
  await app.ready();
  return app;
}
