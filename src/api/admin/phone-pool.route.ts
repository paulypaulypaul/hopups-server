import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";

const updatePoolSchema = z.object({
  numbers: z.array(z.string()),
  defaultNumber: z.string().nullable().optional()
});

export function registerPhonePoolRoutes(app: FastifyInstance): void {
  app.get("/api/admin/sites/:siteId/phone-pool", async (request, reply) => {
    const { siteId } = request.params as { siteId: string };
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return reply.status(404).send({ error: "Not found" });
    }

    const numbers = await prisma.phoneNumber.findMany({ where: { siteId } });
    return { numbers: numbers.map((entry) => entry.number), defaultNumber: site.defaultNumber };
  });

  app.put("/api/admin/sites/:siteId/phone-pool", async (request, reply) => {
    const { siteId } = request.params as { siteId: string };
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return reply.status(404).send({ error: "Not found" });
    }

    const parsed = updatePoolSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request", details: parsed.error.flatten() });
    }

    const defaultNumber = parsed.data.defaultNumber ?? null;

    await prisma.$transaction([
      prisma.phoneNumber.deleteMany({ where: { siteId } }),
      prisma.phoneNumber.createMany({ data: parsed.data.numbers.map((number) => ({ siteId, number })) }),
      prisma.site.update({ where: { id: siteId }, data: { defaultNumber } })
    ]);

    return { numbers: parsed.data.numbers, defaultNumber };
  });
}
