import type { FastifyInstance } from "fastify";
import { registerWidgetConfigRoute } from "./config.route.js";
import { registerWidgetLoaderRoute } from "./loader.route.js";

export async function registerWidgetRoutes(app: FastifyInstance): Promise<void> {
  registerWidgetConfigRoute(app);
  await registerWidgetLoaderRoute(app);
}
