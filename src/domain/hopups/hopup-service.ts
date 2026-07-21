import { prisma } from "../../db/prisma.js";
import { evaluateHopupConditions, type Condition, type SignalContext } from "../rules/index.js";
import type { Session } from "../visitors/index.js";
import type { ActionType } from "./action-schemas.js";
import type { Action, Hopup } from "./types.js";

interface HopupRecord {
  id: string;
  siteId: string;
  active: boolean;
  conditions: unknown;
  repeatAllowance: number;
  actions: { id: string; hopupId: string; type: string; payload: unknown }[];
}

function toDomainHopup(record: HopupRecord): Hopup {
  return {
    id: record.id,
    siteId: record.siteId,
    active: record.active,
    conditions: (record.conditions ?? []) as Condition[],
    repeatAllowance: record.repeatAllowance,
    actions: record.actions.map((action) => ({
      id: action.id,
      hopupId: action.hopupId,
      type: action.type as ActionType,
      payload: action.payload
    }))
  };
}

function timesShown(hopup: Hopup, completedActionIds: string[]): number {
  return hopup.actions.filter((action) => completedActionIds.includes(action.id)).length;
}

export class HopupValidationError extends Error {}

export function assertHasActions(actionCount: number): void {
  if (actionCount < 1) {
    throw new HopupValidationError("A hopup must have at least one action");
  }
}

export async function selectMatchingHopups(
  siteId: string,
  context: SignalContext,
  session: Pick<Session, "completedActionIds">
): Promise<Hopup[]> {
  const records = await prisma.hopup.findMany({
    where: { siteId, active: true },
    include: { actions: true }
  });

  return records
    .map(toDomainHopup)
    .filter((hopup) => evaluateHopupConditions(hopup.conditions, context))
    .filter((hopup) => timesShown(hopup, session.completedActionIds) < hopup.repeatAllowance);
}

export function pickAction(hopup: Hopup): Action {
  if (hopup.actions.length === 1) {
    return hopup.actions[0];
  }
  const index = Math.floor(Math.random() * hopup.actions.length);
  return hopup.actions[index];
}
