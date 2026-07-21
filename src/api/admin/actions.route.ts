import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { ActionTypeSchema, validateActionPayload, type ActionType } from "../../domain/hopups/index.js";

const createActionSchema = z.object({ type: ActionTypeSchema, payload: z.unknown() });

export function registerActionRoutes(app: FastifyInstance): void {
  app.get("/api/admin/hopups/:hopupId/actions", async (request) => {
    const { hopupId } = request.params as { hopupId: string };
    return prisma.action.findMany({ where: { hopupId } });
  });

  app.post("/api/admin/hopups/:hopupId/actions", async (request, reply) => {
    const { hopupId } = request.params as { hopupId: string };
    const parsed = createActionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request", details: parsed.error.flatten() });
    }

    try {
      validateActionPayload(parsed.data.type, parsed.data.payload);
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }

    const action = await prisma.action.create({
      data: { hopupId, type: parsed.data.type, payload: parsed.data.payload as object }
    });
    return reply.status(201).send(action);
  });

  app.put("/api/admin/actions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.action.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: "Not found" });
    }

    const body = request.body as { type?: ActionType; payload?: unknown };
    const type = body.type ?? (existing.type as ActionType);

    if (body.payload !== undefined) {
      try {
        validateActionPayload(type, body.payload);
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    }

    return prisma.action.update({
      where: { id },
      data: { type: body.type, payload: body.payload as object | undefined }
    });
  });

  app.delete("/api/admin/actions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const action = await prisma.action.findUnique({ where: { id } });
    if (!action) {
      return reply.status(404).send({ error: "Not found" });
    }

    const siblingCount = await prisma.action.count({ where: { hopupId: action.hopupId } });
    if (siblingCount <= 1) {
      return reply.status(400).send({ error: "A hopup must have at least one action" });
    }

    await prisma.action.delete({ where: { id } });
    return reply.status(204).send();
  });
}
