import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { ActionTypeSchema, assertHasActions, validateActionPayload } from "../../domain/hopups/index.js";

const conditionSchema = z.object({
  signal: z.string(),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in", "matches"]),
  value: z.unknown()
});

const createHopupSchema = z.object({
  active: z.boolean().optional(),
  conditions: z.array(conditionSchema).optional(),
  repeatAllowance: z.number().int().min(1).optional(),
  actions: z.array(z.object({ type: ActionTypeSchema, payload: z.unknown() })).min(1)
});

export function registerHopupRoutes(app: FastifyInstance): void {
  app.get("/api/admin/sites/:siteId/hopups", async (request) => {
    const { siteId } = request.params as { siteId: string };
    return prisma.hopup.findMany({ where: { siteId }, include: { actions: true } });
  });

  app.post("/api/admin/sites/:siteId/hopups", async (request, reply) => {
    const { siteId } = request.params as { siteId: string };
    const parsed = createHopupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request", details: parsed.error.flatten() });
    }
    const body = parsed.data;

    try {
      assertHasActions(body.actions.length);
      for (const action of body.actions) {
        validateActionPayload(action.type, action.payload);
      }
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }

    const hopup = await prisma.hopup.create({
      data: {
        siteId,
        active: body.active ?? true,
        conditions: (body.conditions ?? []) as object[],
        repeatAllowance: body.repeatAllowance ?? 1,
        actions: { create: body.actions.map((action) => ({ type: action.type, payload: action.payload as object })) }
      },
      include: { actions: true }
    });

    return reply.status(201).send(hopup);
  });

  app.get("/api/admin/hopups/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const hopup = await prisma.hopup.findUnique({ where: { id }, include: { actions: true } });
    if (!hopup) {
      return reply.status(404).send({ error: "Not found" });
    }
    return hopup;
  });

  app.put("/api/admin/hopups/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.hopup.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: "Not found" });
    }

    const body = request.body as { active?: boolean; conditions?: unknown[]; repeatAllowance?: number };
    return prisma.hopup.update({
      where: { id },
      data: {
        active: body.active,
        conditions: body.conditions as object[] | undefined,
        repeatAllowance: body.repeatAllowance
      },
      include: { actions: true }
    });
  });

  app.delete("/api/admin/hopups/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.hopup.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: "Not found" });
    }

    await prisma.$transaction([
      prisma.actionEvent.deleteMany({ where: { hopupId: id } }),
      prisma.rollupBucket.deleteMany({ where: { hopupId: id } }),
      prisma.action.deleteMany({ where: { hopupId: id } }),
      prisma.hopup.delete({ where: { id } })
    ]);

    return reply.status(204).send();
  });
}
