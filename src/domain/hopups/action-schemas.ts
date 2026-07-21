import { z } from "zod";

export const ActionTypeSchema = z.enum(["modal", "banner", "phoneNumberSwap", "redirect", "customHtml"]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const modalPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional()
});

export const bannerPayloadSchema = z.object({
  message: z.string(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional()
});

export const phoneNumberSwapPayloadSchema = z.object({
  selector: z.string()
});

export const redirectPayloadSchema = z.object({
  url: z.string(),
  delayMs: z.number().optional()
});

export const customHtmlPayloadSchema = z.object({
  html: z.string()
});

export const actionPayloadSchemas: Record<ActionType, z.ZodTypeAny> = {
  modal: modalPayloadSchema,
  banner: bannerPayloadSchema,
  phoneNumberSwap: phoneNumberSwapPayloadSchema,
  redirect: redirectPayloadSchema,
  customHtml: customHtmlPayloadSchema
};

export function validateActionPayload(type: ActionType, payload: unknown): unknown {
  return actionPayloadSchemas[type].parse(payload);
}
