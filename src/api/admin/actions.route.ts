import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../db/prisma.js";
import { ActionTypeSchema, validateActionPayload, type ActionType } from "../../domain/hopups/index.js";
import { errorResponseSchema } from "../shared-schemas.js";

const actionSchema = z.object({
  id: z.string(),
  hopupId: z.string(),
  type: z.string(),
  payload: z.unknown()
});

const createActionSchema = z.object({ type: ActionTypeSchema, payload: z.unknown() });
const updateActionSchema = z.object({ type: ActionTypeSchema.optional(), payload: z.unknown().optional() });

const hopupIdParamsSchema = z.object({ hopupId: z.string() });
const actionIdParamsSchema = z.object({ id: z.string() });

export function registerActionRoutes(app: FastifyInstance): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/api/admin/hopups/:hopupId/actions",
    {
      schema: {
        tags: ["admin"],
        summary: "List a hopup's actions",
        security: [{ bearerAuth: [] }],
        params: hopupIdParamsSchema,
        response: { 200: z.array(actionSchema) }
      }
    },
    async (request) => prisma.action.findMany({ where: { hopupId: request.params.hopupId } })
  );

  typedApp.post(
    "/api/admin/hopups/:hopupId/actions",
    {
      schema: {
        tags: ["admin"],
        summary: "Add an action to a hopup",
        security: [{ bearerAuth: [] }],
        params: hopupIdParamsSchema,
        body: createActionSchema,
        response: { 201: actionSchema, 400: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { hopupId } = request.params;
      const { type, payload } = request.body;

      try {
        validateActionPayload(type, payload);
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }

      const action = await prisma.action.create({
        data: { hopupId, type, payload: payload as object }
      });
      return reply.status(201).send(action);
    }
  );

  typedApp.put(
    "/api/admin/actions/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Update an action's type/payload",
        security: [{ bearerAuth: [] }],
        params: actionIdParamsSchema,
        body: updateActionSchema,
        response: { 200: actionSchema, 400: errorResponseSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const existing = await prisma.action.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: "Not found" });
      }

      const body = request.body;
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
    }
  );

  typedApp.delete(
    "/api/admin/actions/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Delete an action (rejected if it's the hopup's last one)",
        security: [{ bearerAuth: [] }],
        params: actionIdParamsSchema,
        response: { 204: z.undefined(), 400: errorResponseSchema, 404: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
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
    }
  );
}
