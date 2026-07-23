import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { registerSyncRoutes } from "../../src/api/sync/route.js";

export async function buildSyncTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(registerSyncRoutes);
  await app.ready();
  return app;
}
