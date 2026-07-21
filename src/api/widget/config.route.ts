import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";

export function registerWidgetConfigRoute(app: FastifyInstance): void {
  app.get("/api/widget/:siteId/config", async (request, reply) => {
    const { siteId } = request.params as { siteId: string };
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return reply.status(404).send({ error: "Not found" });
    }

    reply.header("Cache-Control", "no-store");

    const syncUrl = `${request.protocol}://${request.headers.host}/api/sync`;

    return { siteId: site.id, syncUrl };
  });
}
