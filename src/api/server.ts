import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerIdentityProvider, FacebookIdentityProvider } from "../domain/identity/index.js";
import { registerSyncRoutes } from "./sync/route.js";
import { registerAdminRoutes } from "./admin/index.js";
import { registerWidgetRoutes } from "./widget/index.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });

  registerIdentityProvider(new FacebookIdentityProvider());

  await app.register(registerSyncRoutes);
  await app.register(registerAdminRoutes);
  await app.register(registerWidgetRoutes);

  return app;
}
