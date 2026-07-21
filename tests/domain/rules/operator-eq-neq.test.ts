import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("eq / neq operators", () => {
  const context = makeContext({ clientVars: { plan: "pro" } });

  it("eq is strict equality", () => {
    expect(evaluateCondition({ signal: "clientVar.plan", operator: "eq", value: "pro" }, context)).toBe(true);
    expect(evaluateCondition({ signal: "clientVar.plan", operator: "eq", value: "free" }, context)).toBe(false);
  });

  it("neq is strict inequality", () => {
    expect(evaluateCondition({ signal: "clientVar.plan", operator: "neq", value: "free" }, context)).toBe(true);
    expect(evaluateCondition({ signal: "clientVar.plan", operator: "neq", value: "pro" }, context)).toBe(false);
  });
});
