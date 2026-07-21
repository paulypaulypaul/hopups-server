import { describe, expect, it } from "vitest";
import { evaluateCondition, registerSignalResolver } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("registerSignalResolver", () => {
  it("adds a new resolvable signal without changing the evaluator", () => {
    registerSignalResolver({ key: "custom.always42", resolve: () => 42 });

    const context = makeContext();
    expect(evaluateCondition({ signal: "custom.always42", operator: "eq", value: 42 }, context)).toBe(true);
  });
});
