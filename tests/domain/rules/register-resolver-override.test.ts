import { describe, expect, it } from "vitest";
import { evaluateCondition, registerSignalResolver } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("registerSignalResolver override", () => {
  it("replaces an existing resolver registered under the same key", () => {
    registerSignalResolver({ key: "custom.overridable", resolve: () => "first" });
    registerSignalResolver({ key: "custom.overridable", resolve: () => "second" });

    const context = makeContext();
    expect(evaluateCondition({ signal: "custom.overridable", operator: "eq", value: "second" }, context)).toBe(
      true
    );
    expect(evaluateCondition({ signal: "custom.overridable", operator: "eq", value: "first" }, context)).toBe(
      false
    );
  });
});
