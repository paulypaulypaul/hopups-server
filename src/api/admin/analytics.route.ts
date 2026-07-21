import type { FastifyInstance } from "fastify";
import { queryEvents, queryRollups, type RollupInterval } from "../../domain/analytics/index.js";

export function registerAnalyticsRoutes(app: FastifyInstance): void {
  app.get("/api/admin/analytics/events", async (request, reply) => {
    const query = request.query as { siteId?: string; hopupId?: string; from?: string; to?: string };
    if (!query.siteId) {
      return reply.status(400).send({ error: "siteId is required" });
    }

    return queryEvents({
      siteId: query.siteId,
      hopupId: query.hopupId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined
    });
  });

  app.get("/api/admin/analytics/rollups", async (request, reply) => {
    const query = request.query as {
      siteId?: string;
      hopupId?: string;
      from?: string;
      to?: string;
      interval?: RollupInterval;
    };
    if (!query.siteId) {
      return reply.status(400).send({ error: "siteId is required" });
    }

    return queryRollups({
      siteId: query.siteId,
      hopupId: query.hopupId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      interval: query.interval
    });
  });
}
