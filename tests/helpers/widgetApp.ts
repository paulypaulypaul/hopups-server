import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { registerWidgetRoutes } from "../../src/api/widget/index.js";

export async function buildWidgetTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(registerWidgetRoutes);
  await app.ready();
  return app;
}
