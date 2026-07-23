import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../db/prisma.js";
import { errorResponseSchema } from "../shared-schemas.js";

const siteIdParamsSchema = z.object({ id: z.string() });

const siteSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultNumber: z.string().nullable(),
  createdAt: z.date()
});

const createSiteBodySchema = z.object({
  name: z.string(),
  defaultNumber: z.string().nullable().optional()
});

const updateSiteBodySchema = z.object({
  name: z.string().optional(),
  defaultNumber: z.string().nullable().optional()
});

export function registerSiteRoutes(app: FastifyInstance): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/api/admin/sites",
    { schema: { tags: ["admin"], summary: "List sites", security: [{ bearerAuth: [] }], response: { 200: z.array(siteSchema) } } },
    async () => prisma.site.findMany()
  );

  typedApp.post(
    "/api/admin/sites",
    {
      schema: {
        tags: ["admin"],
        summary: "Create a site",
        security: [{ bearerAuth: [] }],
        body: createSiteBodySchema,
        response: { 201: siteSchema }
      }
    },
    async (request, reply) => {
      const site = await prisma.site.create({
        data: { name: request.body.name, defaultNumber: request.body.defaultNumber ?? null }
      });
      return reply.status(201).send(site);
    }
  );

  typedApp.get(
    "/api/admin/sites/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Get a site",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        response: { 200: siteSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const site = await prisma.site.findUnique({ where: { id: request.params.id } });
      if (!site) {
        return reply.status(404).send({ error: "Not found" });
      }
      return site;
    }
  );

  typedApp.put(
    "/api/admin/sites/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Rename a site / update its default number",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        body: updateSiteBodySchema,
        response: { 200: siteSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const existing = await prisma.site.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        return reply.status(404).send({ error: "Not found" });
      }
      return prisma.site.update({ where: { id: request.params.id }, data: request.body });
    }
  );

  typedApp.delete(
    "/api/admin/sites/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Delete a site and cascade its hopups, actions, and phone pool",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        response: { 204: z.undefined(), 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const existing = await prisma.site.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: "Not found" });
      }

      await prisma.$transaction([
        prisma.actionEvent.deleteMany({ where: { siteId: id } }),
        prisma.rollupBucket.deleteMany({ where: { siteId: id } }),
        prisma.phoneNumberAllocation.deleteMany({ where: { siteId: id } }),
        prisma.visitorEvent.deleteMany({ where: { siteId: id } }),
        prisma.action.deleteMany({ where: { hopup: { siteId: id } } }),
        prisma.hopup.deleteMany({ where: { siteId: id } }),
        prisma.phoneNumber.deleteMany({ where: { siteId: id } }),
        prisma.session.deleteMany({ where: { siteId: id } }),
        prisma.site.delete({ where: { id } })
      ]);

      return reply.status(204).send();
    }
  );
}
