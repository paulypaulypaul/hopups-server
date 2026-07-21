import { prisma } from "../../src/db/prisma.js";
import type { Condition } from "../../src/domain/rules/index.js";
import type { ActionType } from "../../src/domain/hopups/index.js";

export async function createHopup(options: {
  siteId: string;
  active?: boolean;
  conditions?: Condition[];
  repeatAllowance?: number;
  actions: { type: ActionType; payload: unknown }[];
}) {
  return prisma.hopup.create({
    data: {
      siteId: options.siteId,
      active: options.active ?? true,
      conditions: (options.conditions ?? []) as object[],
      repeatAllowance: options.repeatAllowance ?? 1,
      actions: {
        create: options.actions.map((action) => ({
          type: action.type,
          payload: action.payload as object
        }))
      }
    },
    include: { actions: true }
  });
}
