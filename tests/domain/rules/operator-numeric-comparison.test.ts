import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("gt / gte / lt / lte operators", () => {
  const context = makeContext({ visit: { count: 5 } });

  it("compares numbers correctly", () => {
    expect(evaluateCondition({ signal: "visit.count", operator: "gt", value: 4 }, context)).toBe(true);
    expect(evaluateCondition({ signal: "visit.count", operator: "gte", value: 5 }, context)).toBe(true);
    expect(evaluateCondition({ signal: "visit.count", operator: "lt", value: 6 }, context)).toBe(true);
    expect(evaluateCondition({ signal: "visit.count", operator: "lte", value: 5 }, context)).toBe(true);
    expect(evaluateCondition({ signal: "visit.count", operator: "gt", value: 5 }, context)).toBe(false);
  });

  it("returns false for non-numeric resolved values", () => {
    const stringContext = makeContext({ clientVars: { plan: "pro" } });
    expect(
      evaluateCondition({ signal: "clientVar.plan", operator: "gt", value: 1 }, stringContext)
    ).toBe(false);
  });
});
