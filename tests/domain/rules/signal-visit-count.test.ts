import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("visit.count signal", () => {
  it("resolves to the visitor's total page-view count", () => {
    const context = makeContext({ visit: { count: 3 } });
    expect(evaluateCondition({ signal: "visit.count", operator: "gte", value: 3 }, context)).toBe(true);
    expect(evaluateCondition({ signal: "visit.count", operator: "gt", value: 3 }, context)).toBe(false);
  });
});
