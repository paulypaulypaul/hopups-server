import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../db/prisma.js";
import { ActionTypeSchema, validateActionPayload } from "../../domain/hopups/index.js";
import { errorResponseSchema } from "../shared-schemas.js";

const conditionSchema = z.object({
  signal: z.string(),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in", "matches"]),
  value: z.unknown()
});

const actionSchema = z.object({
  id: z.string(),
  hopupId: z.string(),
  type: z.string(),
  payload: z.unknown()
});

const hopupSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  active: z.boolean(),
  conditions: z.unknown(),
  repeatAllowance: z.number(),
  createdAt: z.date(),
  actions: z.array(actionSchema)
});

const createHopupSchema = z.object({
  active: z.boolean().optional(),
  conditions: z.array(conditionSchema).optional(),
  repeatAllowance: z.number().int().min(1).optional(),
  actions: z.array(z.object({ type: ActionTypeSchema, payload: z.unknown() })).min(1)
});

const updateHopupSchema = z.object({
  active: z.boolean().optional(),
  conditions: z.array(conditionSchema).optional(),
  repeatAllowance: z.number().int().min(1).optional()
});

const siteIdParamsSchema = z.object({ siteId: z.string() });
const hopupIdParamsSchema = z.object({ id: z.string() });

export function registerHopupRoutes(app: FastifyInstance): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/api/admin/sites/:siteId/hopups",
    {
      schema: {
        tags: ["admin"],
        summary: "List a site's hopups",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        response: { 200: z.array(hopupSchema) }
      }
    },
    async (request) => prisma.hopup.findMany({ where: { siteId: request.params.siteId }, include: { actions: true } })
  );

  typedApp.post(
    "/api/admin/sites/:siteId/hopups",
    {
      schema: {
        tags: ["admin"],
        summary: "Create a hopup with at least one action",
        security: [{ bearerAuth: [] }],
        params: siteIdParamsSchema,
        body: createHopupSchema,
        response: { 201: hopupSchema, 400: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { siteId } = request.params;
      const body = request.body;

      try {
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
    }
  );

  typedApp.get(
    "/api/admin/hopups/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Get a hopup",
        security: [{ bearerAuth: [] }],
        params: hopupIdParamsSchema,
        response: { 200: hopupSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const hopup = await prisma.hopup.findUnique({ where: { id: request.params.id }, include: { actions: true } });
      if (!hopup) {
        return reply.status(404).send({ error: "Not found" });
      }
      return hopup;
    }
  );

  typedApp.put(
    "/api/admin/hopups/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Update a hopup's active state, conditions, or repeat allowance",
        security: [{ bearerAuth: [] }],
        params: hopupIdParamsSchema,
        body: updateHopupSchema,
        response: { 200: hopupSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const existing = await prisma.hopup.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: "Not found" });
      }

      const body = request.body;
      return prisma.hopup.update({
        where: { id },
        data: {
          active: body.active,
          conditions: body.conditions as object[] | undefined,
          repeatAllowance: body.repeatAllowance
        },
        include: { actions: true }
      });
    }
  );

  typedApp.delete(
    "/api/admin/hopups/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Delete a hopup and its actions/analytics",
        security: [{ bearerAuth: [] }],
        params: hopupIdParamsSchema,
        response: { 204: z.undefined(), 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
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
    }
  );
}
