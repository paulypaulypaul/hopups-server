import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../db/prisma.js";
import { errorResponseSchema } from "../shared-schemas.js";

const siteIdParamsSchema = z.object({ siteId: z.string() });

const phonePoolSchema = z.object({
  numbers: z.array(z.string()),
  defaultNumber: z.string().nullable()
});

const updatePoolSchema = z.object({
  numbers: z.array(z.string()),
  defaultNumber: z.string().nullable().optional()
});

export function registerPhonePoolRoutes(app: FastifyInstance): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/api/admin/sites/:siteId/phone-pool",
    {
      schema: {
        tags: ["admin"],
        summary: "Get a site's call-tracking number pool",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        response: { 200: phonePoolSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { siteId } = request.params;
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) {
        return reply.status(404).send({ error: "Not found" });
      }

      const numbers = await prisma.phoneNumber.findMany({ where: { siteId } });
      return { numbers: numbers.map((entry) => entry.number), defaultNumber: site.defaultNumber };
    }
  );

  typedApp.put(
    "/api/admin/sites/:siteId/phone-pool",
    {
      schema: {
        tags: ["admin"],
        summary: "Replace a site's number pool and default number",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        body: updatePoolSchema,
        response: { 200: phonePoolSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { siteId } = request.params;
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) {
        return reply.status(404).send({ error: "Not found" });
      }

      const defaultNumber = request.body.defaultNumber ?? null;

      await prisma.$transaction([
        prisma.phoneNumber.deleteMany({ where: { siteId } }),
        prisma.phoneNumber.createMany({ data: request.body.numbers.map((number) => ({ siteId, number })) }),
        prisma.site.update({ where: { id: siteId }, data: { defaultNumber } })
      ]);

      return { numbers: request.body.numbers, defaultNumber };
    }
  );
}
