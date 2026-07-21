import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("undefined resolved signal", () => {
  it("evaluates false for every operator, including eq against undefined-ish values", () => {
    const context = makeContext({ query: {} });
    const operators = ["eq", "neq", "gt", "gte", "lt", "lte", "in", "matches"] as const;

    for (const operator of operators) {
      expect(evaluateCondition({ signal: "query.missing", operator, value: "anything" }, context)).toBe(false);
    }
  });
});
