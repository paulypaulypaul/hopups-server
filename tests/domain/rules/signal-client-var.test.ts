import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("clientVar.<key> signal", () => {
  it("resolves to the named client variable's value", () => {
    const context = makeContext({ clientVars: { plan: "pro" } });
    expect(evaluateCondition({ signal: "clientVar.plan", operator: "eq", value: "pro" }, context)).toBe(true);
    expect(evaluateCondition({ signal: "clientVar.plan", operator: "eq", value: "free" }, context)).toBe(false);
  });
});
