import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("in operator", () => {
  it("is true when the resolved signal is a member of the value array", () => {
    const context = makeContext({ query: { utm_source: "facebook" } });
    expect(
      evaluateCondition({ signal: "query.utm_source", operator: "in", value: ["facebook", "twitter"] }, context)
    ).toBe(true);
    expect(
      evaluateCondition({ signal: "query.utm_source", operator: "in", value: ["google"] }, context)
    ).toBe(false);
  });

  it("is false when value is not an array", () => {
    const context = makeContext({ query: { utm_source: "facebook" } });
    expect(
      evaluateCondition({ signal: "query.utm_source", operator: "in", value: "facebook" }, context)
    ).toBe(false);
  });
});
