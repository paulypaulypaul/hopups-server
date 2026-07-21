import { z } from "zod";

export const syncEventSchema = z
  .object({
    type: z.string().min(1),
    path: z.string().optional(),
    payload: z.record(z.unknown()).optional(),
    timestamp: z.string()
  })
  .refine((event) => event.type !== "pageview" || (typeof event.path === "string" && event.path.length > 0), {
    message: "path is required when type is 'pageview'"
  });

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

export type SyncRequestBody = z.infer<typeof syncRequestSchema>;
export type SyncEvent = z.infer<typeof syncEventSchema>;
