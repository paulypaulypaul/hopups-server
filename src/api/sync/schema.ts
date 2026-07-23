import { z } from "zod";

export { errorResponseSchema } from "../shared-schemas.js";

export const syncEventSchema = z.object({
  type: z.string().min(1),
  path: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.string()
});

// A pageview event without a path is rejected in the route handler rather than via a Zod
// `.refine()` here — ZodEffects wrappers break JSON Schema generation for the OpenAPI docs.
export function isValidSyncEvent(event: SyncEvent): boolean {
  return event.type !== "pageview" || (typeof event.path === "string" && event.path.length > 0);
}

export const syncRequestSchema = z.object({
  visitorId: z.string().min(1),
  siteId: z.string().min(1),
  events: z.array(syncEventSchema).default([]),
  query: z.record(z.string()).optional(),
  clientVars: z.record(z.unknown()).optional(),
  location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional()
    })
    .optional(),
  completedActionIds: z.array(z.string()).optional()
});

export const syncResponseSchema = z.object({
  visitorId: z.string(),
  sessionId: z.string(),
  phoneNumber: z.string().nullable(),
  actions: z.array(
    z.object({
      hopupId: z.string(),
      actionId: z.string(),
      type: z.string(),
      payload: z.unknown()
    })
  )
});

export type SyncRequestBody = z.infer<typeof syncRequestSchema>;
export type SyncEvent = z.infer<typeof syncEventSchema>;
