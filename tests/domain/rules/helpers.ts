import type { SignalContext } from "../../../src/domain/rules/index.js";

export function makeContext(overrides: Partial<SignalContext> = {}): SignalContext {
  return {
    page: { path: "/" },
    visit: { count: 1 },
    session: { inactivityMinutes: 0 },
    query: {},
    clientVars: {},
    ...overrides
  };
}
