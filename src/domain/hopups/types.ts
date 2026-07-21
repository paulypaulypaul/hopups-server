import type { Condition } from "../rules/index.js";
import type { ActionType } from "./action-schemas.js";

export interface Action {
  id: string;
  hopupId: string;
  type: ActionType;
  payload: unknown;
}

export interface Hopup {
  id: string;
  siteId: string;
  active: boolean;
  conditions: Condition[];
  repeatAllowance: number;
  actions: Action[];
}
