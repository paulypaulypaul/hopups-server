import type { FastifyInstance } from "fastify";
import { registerLoginRoute, requireAdminAuth } from "./auth.js";
import { registerSiteRoutes } from "./sites.route.js";
import { registerHopupRoutes } from "./hopups.route.js";
import { registerActionRoutes } from "./actions.route.js";
import { registerPhonePoolRoutes } from "./phone-pool.route.js";
import { registerAnalyticsRoutes } from "./analytics.route.js";

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  registerLoginRoute(app);

  await app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", requireAdminAuth);
    registerSiteRoutes(protectedApp);
    registerHopupRoutes(protectedApp);
    registerActionRoutes(protectedApp);
    registerPhonePoolRoutes(protectedApp);
    registerAnalyticsRoutes(protectedApp);
  });
}
