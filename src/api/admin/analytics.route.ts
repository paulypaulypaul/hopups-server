import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { queryEvents, queryRollups } from "../../domain/analytics/index.js";
import { errorResponseSchema } from "../shared-schemas.js";

const actionEventSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  hopupId: z.string(),
  actionId: z.string(),
  visitorId: z.string(),
  sessionId: z.string(),
  shownAt: z.date()
});

const rollupBucketSchema = z.object({
  siteId: z.string(),
  hopupId: z.string(),
  interval: z.enum(["minute", "hour", "day"]),
  intervalStart: z.date(),
  count: z.number()
});

const eventsQuerySchema = z.object({
  siteId: z.string(),
  hopupId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

const rollupsQuerySchema = eventsQuerySchema.extend({
  interval: z.enum(["minute", "hour", "day"]).optional()
});

export function registerAnalyticsRoutes(app: FastifyInstance): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/api/admin/analytics/events",
    {
      schema: {
        tags: ["admin"],
        summary: "Query the raw action-shown event log",
        security: [{ bearerAuth: [] }],
        querystring: eventsQuerySchema,
        response: { 200: z.array(actionEventSchema), 400: errorResponseSchema }
      }
    },
    async (request) => {
      const query = request.query;
      return queryEvents({
        siteId: query.siteId,
        hopupId: query.hopupId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined
      });
    }
  );

  typedApp.get(
    "/api/admin/analytics/rollups",
    {
      schema: {
        tags: ["admin"],
        summary: "Query time-series rollup buckets",
        security: [{ bearerAuth: [] }],
        querystring: rollupsQuerySchema,
        response: { 200: z.array(rollupBucketSchema), 400: errorResponseSchema }
      }
    },
    async (request) => {
      const query = request.query;
      return queryRollups({
        siteId: query.siteId,
        hopupId: query.hopupId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        interval: query.interval
      });
    }
  );
}
