import Fastify, { type FastifyInstance } from "fastify";
import { registerAdminRoutes } from "../../src/api/admin/index.js";
import { config } from "../../src/config.js";

export async function buildAdminTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(registerAdminRoutes);
  await app.ready();
  return app;
}

export async function getAdminToken(app: FastifyInstance): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/admin/login",
    payload: { username: config.adminUsername, password: config.adminPassword }
  });
  return response.json().token as string;
}
