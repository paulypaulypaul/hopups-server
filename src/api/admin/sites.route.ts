import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";

export function registerSiteRoutes(app: FastifyInstance): void {
  app.get("/api/admin/sites", async () => prisma.site.findMany());

  app.post("/api/admin/sites", async (request, reply) => {
    const body = request.body as { name: string; defaultNumber?: string | null };
    const site = await prisma.site.create({
      data: { name: body.name, defaultNumber: body.defaultNumber ?? null }
    });
    return reply.status(201).send(site);
  });

  app.get("/api/admin/sites/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      return reply.status(404).send({ error: "Not found" });
    }
    return site;
  });

  app.put("/api/admin/sites/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.site.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: "Not found" });
    }

    const body = request.body as { name?: string; defaultNumber?: string | null };
    return prisma.site.update({ where: { id }, data: body });
  });

  app.delete("/api/admin/sites/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
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
  });
}
