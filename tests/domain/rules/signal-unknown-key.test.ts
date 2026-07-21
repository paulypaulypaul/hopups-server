import { describe, expect, it } from "vitest";
import { evaluateCondition, resolveSignal } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("unknown signal key", () => {
  it("resolves to undefined rather than throwing", () => {
    const context = makeContext();
    expect(() => resolveSignal("totally.unknown", context)).not.toThrow();
    expect(resolveSignal("totally.unknown", context)).toBeUndefined();
  });

  it("makes the condition evaluate false", () => {
    const context = makeContext();
    expect(evaluateCondition({ signal: "totally.unknown", operator: "eq", value: "x" }, context)).toBe(false);
  });
});
