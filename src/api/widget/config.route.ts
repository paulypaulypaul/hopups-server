import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../db/prisma.js";
import { errorResponseSchema } from "../shared-schemas.js";

const siteIdParamsSchema = z.object({ siteId: z.string() });

const widgetConfigSchema = z.object({
  siteId: z.string(),
  syncUrl: z.string()
});

export function registerWidgetConfigRoute(app: FastifyInstance): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/api/widget/:siteId/config",
    {
      schema: {
        tags: ["widget"],
        summary: "Get a site's widget config",
        params: siteIdParamsSchema,
        response: { 200: widgetConfigSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { siteId } = request.params;
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) {
        return reply.status(404).send({ error: "Not found" });
      }

      reply.header("Cache-Control", "no-store");

      const syncUrl = `${request.protocol}://${request.headers.host}/api/sync`;

      return { siteId: site.id, syncUrl };
    }
  );
}
